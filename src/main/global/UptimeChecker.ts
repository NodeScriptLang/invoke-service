import { ServerError } from '@nodescript/errors';
import { statusCheck } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export class UptimeChecker {

    @config({ default: 24 * 60 * 60 }) MAX_MEAN_UPTIME_SECONDS!: number;

    @dep() private logger!: Logger;

    startedAt = Date.now();

    // The actual uptime is calculated as +/- 25% of configured mean uptime
    maxUptimeMs = randomRange(.75, 1.25) * this.MAX_MEAN_UPTIME_SECONDS * 1000;

    @statusCheck()
    checkUptime() {
        if (Date.now() > this.startedAt + this.maxUptimeMs) {
            this.logger.warn('Max uptime reached');
            throw new ServerError('Max uptime reached');
        }
        return 'ok';
    }

}

function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
