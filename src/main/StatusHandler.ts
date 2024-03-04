import fs from 'node:fs';

import { HttpContext, HttpHandler, HttpNext } from '@nodescript/http-server';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

export class StatusHandler implements HttpHandler {

    async handle(ctx: HttpContext, next: HttpNext) {
        if (ctx.method !== 'GET' || ctx.path !== '/status') {
            return next();
        }
        ctx.status = 200;
        ctx.responseBody = {
            version: pkg.version,
        };
    }

}
