import { HttpChain, HttpContext, HttpErrorHandler, HttpMetricsHandler, HttpNext, HttpServer } from '@nodescript/http-server';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { LivenessHandler } from './LivenessHandler.js';
import { StatusHandler } from './StatusHandler.js';

export class AuxHttpServer extends HttpServer {

    @config({ default: 8081 })
    AUX_HTTP_PORT!: number;

    @dep() private errorHandler!: HttpErrorHandler;
    @dep() private metricsHandler!: HttpMetricsHandler;
    @dep() private statusHandler!: StatusHandler;
    @dep() private livenessHandler!: LivenessHandler;

    constructor() {
        super();
        this.config.port = this.AUX_HTTP_PORT;
        this.config.shutdownDelay = 0;
    }

    handler = new HttpChain([
        this.errorHandler,
        this.metricsHandler,
        this.statusHandler,
        this.livenessHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.handler.handle(ctx, next);
    }

}
