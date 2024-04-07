import { ServerError } from '@nodescript/errors';
import { statusCheck } from '@nodescript/http-server';
import { GaugeMetric, metric } from '@nodescript/metrics';
import { createHash } from 'crypto';
import { config } from 'mesh-config';

import { PreconditionFailedError } from '../errors.js';

export class ModuleResolver {

    @config({ default: 10_000 }) MAX_MODULE_RESOLUTIONS!: number;

    @metric()
    private moduleResolutions = new GaugeMetric<{}>(
        'nodescript_invoke_module_resolutions_total', 'Total Module Resolutions');

    // Used to count unique module URLs
    // TODO consider replacing with HyperLogLog to avoid storing
    private moduleHashes = new Set<string>;

    @statusCheck()
    checkMaxResolutions() {
        if (this.moduleHashes.size > this.MAX_MODULE_RESOLUTIONS) {
            throw new ServerError('Max module resolutions reached');
        }
        return 'ok';
    }

    async resolveModule(moduleUrl: string) {
        try {
            this.trackModuleUrl(moduleUrl);
            const { compute } = await import(moduleUrl);
            if (typeof compute !== 'function') {
                throw new PreconditionFailedError('Unsupported module: export compute function expected');
            }
            return compute;
        } catch (error: any) {
            throw new PreconditionFailedError(`Could not load module: ${error.message}`);
        }
    }

    private trackModuleUrl(moduleUrl: string) {
        const hash = createHash('sha256').update(moduleUrl, 'utf-8').digest('hex').substring(0, 16);
        this.moduleHashes.add(hash);
        this.moduleResolutions.set(this.moduleHashes.size);
    }

}
