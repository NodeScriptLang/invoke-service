import { ServerError } from '@nodescript/errors';
import { statusCheck } from '@nodescript/http-server';
import { config } from 'mesh-config';

export class UptimeChecker {

    @config({ default: 24 * 60 * 60 }) MAX_UPTIME_SECONDS!: number;

    startedAt = Date.now();

    @statusCheck()
    checkUptime() {
        if (Date.now() > this.startedAt + this.MAX_UPTIME_SECONDS * 1000) {
            throw new ServerError('Max uptime reached');
        }
        return 'ok';
    }

}
