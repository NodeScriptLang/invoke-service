import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

import { GraphEvalContext } from '@nodescript/core/runtime';
import { NotFoundError } from '@nodescript/errors';
import { LRUCache } from 'lru-cache';
import { config } from 'mesh-config';

import { ModuleImportsNotSupported, ModuleLoadFailedError } from '../errors.js';

export class ModuleCompute {

    @config({ default: 10000 }) MODULE_CACHE_SIZE!: number;
    @config({ default: 600_000 }) MODULE_CACHE_TTL!: number;

    moduleCache = new LRUCache<string, string>({
        max: this.MODULE_CACHE_SIZE,
        ttl: this.MODULE_CACHE_TTL,
        ttlAutopurge: false,
    });

    async compute(moduleUrl: string, params: Record<string, any>) {
        const moduleSource = await this.fetchModule(moduleUrl);
        const ctx = new GraphEvalContext();
        ctx.setLocal('NS_ENV', 'server');
        const contextifiedObject = vm.createContext({
            ctx,
            params,
            result: undefined,
            setTimeout,
            clearTimeout,
            crypto,
            fetch,
            FormData,
            Headers,
            Request,
            Response,
            TextDecoder,
            TextEncoder,
            URL,
            URLSearchParams,
        });
        const module = new vm.SourceTextModule(`
        import { compute } from '@MODULE';
        try {
            result = await compute(params, ctx);
        } finally {
            await ctx.finalize();
        }
        `, { context: contextifiedObject });
        await module.link(specifier => {
            if (specifier === '@MODULE') {
                return new vm.SourceTextModule(moduleSource, { context: contextifiedObject });
            }
            throw new ModuleImportsNotSupported(`Unsupported import: ${specifier}`);
        });
        await module.evaluate();
        return contextifiedObject.result;
    }

    async fetchModule(moduleUrl: string) {
        try {
            const cached = this.moduleCache.get(moduleUrl);
            if (cached) {
                return cached;
            }
            const moduleSource = await this.loadModuleSource(moduleUrl);
            this.moduleCache.set(moduleUrl, moduleSource);
            return moduleSource;
        } catch (error: any) {
            throw new ModuleLoadFailedError(`Could not fetch module: ${error?.message}`);
        }
    }

    private async loadModuleSource(moduleUrl: string): Promise<string> {
        const dataUrlPrefix = 'data:text/javascript;base64,';
        if (moduleUrl.startsWith(dataUrlPrefix)) {
            return this.loadDataUrlModule(moduleUrl.substring(dataUrlPrefix.length));
        }
        if (moduleUrl.startsWith('file:')) {
            return await this.loadFileModule(moduleUrl);
        }
        if (moduleUrl.startsWith('http://') || moduleUrl.startsWith('https://')) {
            return await this.loadHttpModule(moduleUrl);
        }
        throw new ModuleLoadFailedError(`Unsupported module URL`);

    }

    private loadDataUrlModule(moduleBase64: string) {
        return decodeURIComponent(Buffer.from(moduleBase64, 'base64').toString('utf-8'));
    }

    private async loadFileModule(moduleUrl: string) {
        return await readFile(new URL(moduleUrl).pathname, 'utf-8');
    }

    private async loadHttpModule(moduleUrl: string) {
        const res = await fetch(moduleUrl);
        if (res.status === 404) {
            throw new NotFoundError('Module not found');
        }
        if (!res.ok) {
            throw new ModuleLoadFailedError(`Could not fetch module: HTTP ${res.status}`);
        }
        return await res.text();
    }

}
