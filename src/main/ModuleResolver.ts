import { createHash } from 'crypto';
import { dep } from 'mesh-ioc';

import { PreconditionFailedError } from './errors.js';
import { Metrics } from './Metrics.js';

export class ModuleResolver {

    @dep() private metrics!: Metrics;

    // Used to count unique module URLs
    // TODO consider replacing with HyperLogLog to avoid storing
    private moduleHashes = new Set<string>;

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
        this.metrics.moduleResolutions.set(this.moduleHashes.size);
    }

}
