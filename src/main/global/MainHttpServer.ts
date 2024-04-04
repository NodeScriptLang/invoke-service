import { HttpChain, HttpContext, HttpErrorHandler, HttpMetricsHandler, HttpNext, HttpServer, HttpStatusHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { InvokeHandler } from './InvokeHandler.js';
import { LivenessHandler } from './LivenessHandler.js';

export class MainHttpServer extends HttpServer {

    @dep() private errorHandler!: HttpErrorHandler;
    @dep() private metricsHandler!: HttpMetricsHandler;
    @dep() private statusHandler!: HttpStatusHandler;
    @dep() private livenessHandler!: LivenessHandler;
    @dep() private invokeHandler!: InvokeHandler;

    handler = new HttpChain([
        this.errorHandler,
        this.invokeHandler,
        this.statusHandler,
        this.metricsHandler,
        this.livenessHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.handler.handle(ctx, next);
    }

}
