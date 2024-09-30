import { GraphEvalContext } from '@nodescript/core/runtime';
import { ResponseSpec } from '@nodescript/core/schema';
import { errorToResponse, resultToResponse } from '@nodescript/core/util';
import { ServerError } from '@nodescript/errors';
import { fetchUndici } from '@nodescript/fetch-undici';
import { HttpContext, HttpHandler, HttpNext, statusCheck } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { PreconditionFailedError } from '../errors.js';
import { ModuleResolver } from './ModuleResolver.js';

const EXTENDED_LATENCY_BUCKETS = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5,
    1, 2.5, 5, 10, 20, 30, 60,
    90, 120, 180, 240, 300, 600, 900, 1200
];

const process = global.process;

export class InvokeHandler implements HttpHandler {

    @config({ default: 10_000_000_000 }) MAX_INVOCATIONS!: number;

    @dep() private logger!: Logger;
    @dep() private moduleResolver!: ModuleResolver;

    @metric()
    private latency = new HistogramMetric<{}>(
        'nodescript_invoke_latency_seconds', 'Invoke Latency', EXTENDED_LATENCY_BUCKETS);

    @metric()
    private count = new CounterMetric<{}>(
        'nodescript_invoke_invocations_total', 'Total Invocations');

    async handle(ctx: HttpContext, next: HttpNext): Promise<void> {
        if (ctx.method !== 'POST' || ctx.path !== '/invoke') {
            return next();
        }
        const startedAt = Date.now();
        const [
            compute,
            params
        ] = await Promise.all([
            this.moduleResolver.resolveModule(this.getModuleUrl(ctx)),
            this.readParams(ctx),
        ]);
        if (!params) {
            // Client disconnected, don't do any work
            return;
        }
        const response = await this.computeResponse(compute, params);
        ctx.status = response.status;
        ctx.addResponseHeaders(response.headers);
        ctx.addResponseHeader('ns-invoke-pod', String(process.env.HOSTNAME));
        ctx.responseBody = response.body;
        this.count.incr();
        this.latency.addMillis(Date.now() - startedAt);
    }

    @statusCheck()
    checkMaxInvocations() {
        const value = this.count.get({})?.value ?? 0;
        if (value > this.MAX_INVOCATIONS) {
            this.logger.warn('Max invocations reached');
            throw new ServerError('Max invocations reached');
        }
        return 'ok';
    }

    private async readParams(ctx: HttpContext) {
        try {
            const json = await ctx.readRequestBody('json');
            if (json && typeof json === 'object') {
                return json;
            }
            return null;
        } catch (error: any) {
            if (error.code === 'ECONNRESET') {
                return null;
            }
            throw error;
        }
    }

    private getModuleUrl(ctx: HttpContext) {
        const moduleUrl = ctx.getRequestHeader('ns-module-url');
        if (!moduleUrl) {
            throw new PreconditionFailedError('ns-module-url required');
        }
        return moduleUrl;
    }

    private async computeResponse(computeFn: (...args: any[]) => Promise<any>, params: Record<string, any>): Promise<ResponseSpec> {
        const ctx = new GraphEvalContext();
        ctx.lib.fetch = fetchUndici;
        ctx.setLocal('NS_ENV', 'server');
        ctx.setLocal('NS_FETCH_FUNCTION', fetchUndici); // Deprecated, left for compatibility
        try {
            const result = await computeFn(params, ctx);
            return resultToResponse(result);
        } catch (error) {
            this.logger.warn('Graph error', { error });
            return errorToResponse(error);
        } finally {
            ctx.finalize();
        }
    }

}
