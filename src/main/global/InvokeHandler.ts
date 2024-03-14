import { RequestMethod, RequestSpec, ResponseSpec } from '@nodescript/core/schema';
import { errorToResponse, resultToResponse } from '@nodescript/core/util';
import { HttpContext, HttpDict, HttpHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { dep } from 'mesh-ioc';

import { PreconditionFailedError } from '../errors.js';
import { convertResponseStatus } from '../util.js';
import { Metrics } from './Metrics.js';
import { ModuleCompute } from './ModuleCompute.js';

export class InvokeHandler implements HttpHandler {

    @dep() private logger!: Logger;
    @dep() private metrics!: Metrics;
    @dep() private moduleCompute!: ModuleCompute;

    async handle(ctx: HttpContext): Promise<void> {
        try {
            const moduleUrl = this.getModuleUrl(ctx);
            const startedAt = Date.now();
            const [
                $variables,
                $request,
            ] = await Promise.all([
                this.parseVariables(ctx),
                this.createRequestObject(ctx),
            ]);
            if (!$request) {
                // Client disconnected, don't do any work
                return;
            }
            const response = await this.computeResponse(moduleUrl, {
                $request,
                $variables,
            });
            ctx.status = convertResponseStatus(response.status);
            ctx.addResponseHeaders(response.headers);
            ctx.responseBody = response.body;
            this.metrics.invocations.incr();
            this.metrics.invocationLatency.addMillis(Date.now() - startedAt);
        } catch (error) {
            this.logger.error('Invocation failed', { error });
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
                path: ctx.path,
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

    private async computeResponse(moduleUrl: string, params: Record<string, any>): Promise<ResponseSpec> {
        try {
            const result = await this.moduleCompute.compute(moduleUrl, params);
            return resultToResponse(result);
        } catch (error) {
            return errorToResponse(error);
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
