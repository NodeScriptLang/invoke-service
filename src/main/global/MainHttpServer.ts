import { HttpChain, HttpContext, HttpErrorHandler, HttpNext, HttpServer } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { InvokeHandler } from './InvokeHandler.js';

export class MainHttpServer extends HttpServer {

    @dep() private errorHandler!: HttpErrorHandler;
    @dep() private invokeHandler!: InvokeHandler;

    handler = new HttpChain([
        this.errorHandler,
        this.invokeHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.handler.handle(ctx, next);
    }

}
