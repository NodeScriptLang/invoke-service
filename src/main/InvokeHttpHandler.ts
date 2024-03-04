import { GraphEvalContext } from '@nodescript/core/runtime';
import { RequestMethod, RequestSpec, ResponseSpec } from '@nodescript/core/schema';
import { errorToResponse, resultToResponse } from '@nodescript/core/util';
import { HttpContext, HttpDict, HttpHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { dep } from 'mesh-ioc';

import { PreconditionFailedError } from './errors.js';
import { convertResponseStatus } from './util.js';

export class InvokeHttpHandler implements HttpHandler {

    @dep() private logger!: Logger;

    async handle(ctx: HttpContext): Promise<void> {
        const [
            compute,
            $variables,
            $request,
        ] = await Promise.all([
            this.resolveModule(ctx),
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
    }

    private async resolveModule(ctx: HttpContext) {
        const moduleUrl = ctx.getRequestHeader('ns-module-url');
        if (!moduleUrl) {
            throw new PreconditionFailedError('ns-module-url required');
        }
        try {
            const { compute } = await import(moduleUrl);
            if (typeof compute !== 'function') {
                throw new PreconditionFailedError('Unsupported module: export compute function expected');
            }
            return compute;
        } catch (error: any) {
            throw new PreconditionFailedError(`Could not load module: ${error.message}`);
        }
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
