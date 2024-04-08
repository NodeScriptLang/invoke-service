import { ServerError } from '@nodescript/errors';
import { statusCheck } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export class UptimeChecker {

    @config({ default: 24 * 60 * 60 }) MAX_UPTIME_SECONDS!: number;

    @dep() private logger!: Logger;

    startedAt = Date.now();

    @statusCheck()
    checkUptime() {
        if (Date.now() > this.startedAt + this.MAX_UPTIME_SECONDS * 1000) {
            this.logger.warn('Max uptime reached');
            throw new ServerError('Max uptime reached');
        }
        return 'ok';
    }

}
