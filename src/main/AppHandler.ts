import { HttpChain, HttpHandler, HttpMetricsHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { InvokeHandler } from './InvokeHandler.js';
import { StatusHandler } from './StatusHandler.js';

export class AppHandler extends HttpChain {

    @dep() private invokeHandler!: InvokeHandler;
    @dep() private metricsHandler!: HttpMetricsHandler;
    @dep() private statusHandler!: StatusHandler;

    override handlers: HttpHandler[] = [
        this.invokeHandler,
        this.metricsHandler,
        this.statusHandler,
    ];

}
