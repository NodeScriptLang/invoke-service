import { ServerError } from '@nodescript/errors';
import { HttpContext, HttpHandler, HttpNext } from '@nodescript/http-server';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { Metrics } from './Metrics.js';

/**
 * Returns 503 when the server reaches one of the threshold conditions (set via env):
 *
 * - MAX_MODULE_RESOLUTIONS — the max number of unique moduleUrls loaded
 * - MAX_INVOCATIONS — the max number of invocation requests processed
 * - MAX_UPTIME_SECONDS — max service uptime
 *
 * This is intended to be used as Kubernetes readinessProbe and livenessProbe
 * to dynamically rotate the pods.
 */
export class LivenessHandler implements HttpHandler {

    @config({ default: 10_000 }) MAX_MODULE_RESOLUTIONS!: number;
    @config({ default: 10_000_000_000 }) MAX_INVOCATIONS!: number;
    @config({ default: 24 * 60 * 60 }) MAX_UPTIME_SECONDS!: number;

    @dep() private metrics!: Metrics;

    private startedAt = Date.now();

    async handle(ctx: HttpContext, next: HttpNext) {
        if (ctx.method !== 'GET' || ctx.path !== '/liveness') {
            return next();
        }
        try {
            this.checkMaxInvocations();
            this.checkMaxResolutions();
            this.checkMaxUptime();
            ctx.status = 200;
            ctx.responseBody = 'OK';
        } catch (error: any) {
            ctx.status = 503;
            ctx.responseBody = {
                name: error.name,
                code: error.code,
                details: error.details,
            };
        }
    }

    private checkMaxInvocations() {
        const value = this.metrics.invocations.get()?.value ?? 0;
        if (value > this.MAX_INVOCATIONS) {
            throw new ServerError('Max invocations reached');
        }
    }

    private checkMaxResolutions() {
        const value = this.metrics.moduleResolutions.get()?.value ?? 0;
        if (value > this.MAX_MODULE_RESOLUTIONS) {
            throw new ServerError('Max module resolutions reached');
        }
    }

    private checkMaxUptime() {
        if (Date.now() > this.startedAt + this.MAX_UPTIME_SECONDS * 1000) {
            throw new ServerError('Max uptime reached');
        }
    }

}
