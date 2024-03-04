import { GraphEvalContext } from '@nodescript/core/runtime';
import { RequestMethod, RequestSpec, ResponseSpec } from '@nodescript/core/schema';
import { errorToResponse, resultToResponse } from '@nodescript/core/util';
import { HttpContext, HttpDict, HttpHandler, HttpNext } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { PreconditionFailedError } from './errors.js';
import { Metrics } from './Metrics.js';
import { ModuleResolver } from './ModuleResolver.js';
import { convertResponseStatus } from './util.js';

export class InvokeHandler implements HttpHandler {

    @config({ default: '/invoke' }) INVOKE_PREFIX!: string;

    @dep() private logger!: Logger;
    @dep() private metrics!: Metrics;
    @dep() private moduleResolver!: ModuleResolver;

    async handle(ctx: HttpContext, next: HttpNext): Promise<void> {
        if (!ctx.path.startsWith(this.INVOKE_PREFIX)) {
            return next();
        }
        const startedAt = Date.now();
        const [
            compute,
            $variables,
            $request,
        ] = await Promise.all([
            this.moduleResolver.resolveModule(this.getModuleUrl(ctx)),
            this.parseVariables(ctx),
            this.createRequestObject(ctx),
        ]);
        if (!$request) {
            // Client disconnected, don't do any work
            return;
        }
        const response = await this.computeResponse(compute, {
            $request,
            $variables,
        });
        ctx.status = convertResponseStatus(response.status);
        ctx.addResponseHeaders(response.headers);
        ctx.responseBody = response.body;
        this.metrics.invocations.incr();
        this.metrics.invocationLatency.addMillis(Date.now() - startedAt);
    }

    private getModuleUrl(ctx: HttpContext) {
        const moduleUrl = ctx.getRequestHeader('ns-module-url');
        if (!moduleUrl) {
            throw new PreconditionFailedError('ns-module-url required');
        }
        return moduleUrl;
    }

    private getRequestPath(ctx: HttpContext) {
        return ctx.path.substring(this.INVOKE_PREFIX.length);
    }

    private parseVariables(ctx: HttpContext): Record<string, string> {
        try {
            const json = ctx.getRequestHeader('ns-variables', '{}');
            return JSON.parse(json);
        } catch (error) {
            this.logger.warn('parseVariables failed', { error });
            return {};
        }
    }

    private async createRequestObject(ctx: HttpContext): Promise<RequestSpec | null> {
        try {
            const body = await ctx.readRequestBody();
            return {
                method: ctx.method as RequestMethod,
                path: this.getRequestPath(ctx),
                query: ctx.query,
                headers: this.stripNsHeaders(ctx.requestHeaders),
                body,
            };
        } catch (error: any) {
            if (error.code === 'ECONNRESET') {
                return null;
            }
            throw error;
        }
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

    private stripNsHeaders(headers: HttpDict): HttpDict {
        const res: HttpDict = {};
        for (const [key, value] of Object.entries(headers)) {
            if (key.toLowerCase().startsWith('ns-')) {
                continue;
            }
            res[key] = value;
        }
        return res;
    }

}
