import { GraphEvalContext } from '@nodescript/core/runtime';
import { ResponseSpec } from '@nodescript/core/schema';
import { errorToResponse, resultToResponse } from '@nodescript/core/util';
import { HttpContext, HttpHandler, HttpNext } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { dep } from 'mesh-ioc';

import { PreconditionFailedError } from '../errors.js';
import { Metrics } from './Metrics.js';
import { ModuleResolver } from './ModuleResolver.js';

export class InvokeHandler implements HttpHandler {

    @dep() private metrics!: Metrics;
    @dep() private moduleResolver!: ModuleResolver;

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
        ctx.responseBody = response.body;
        this.metrics.invocations.incr();
        this.metrics.invocationLatency.addMillis(Date.now() - startedAt);
        ctx.log = false;
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
        ctx.setLocal('NS_ENV', 'server');
        try {
            const result = await computeFn(params, ctx);
            return resultToResponse(result);
        } catch (error) {
            return errorToResponse(error);
        } finally {
            ctx.finalize();
        }
    }

}
