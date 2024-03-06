import { config } from 'dotenv';
import { Config, ProcessEnvConfig } from 'mesh-config';

import { App } from '../main/app.js';

config({ path: '.env' });
config({ path: '.env.test' });

export class TestRuntime {

    private config = new ProcessEnvConfig();

    app = new App();

    async setup() {
        this.app = new App();
        this.config = new ProcessEnvConfig();
        this.app.mesh.constant(Config, this.config);
        await this.app.start();
    }

    async teardown() {
        await this.app.stop();
    }

    get baseUrl() {
        return `http://localhost:${process.env.HTTP_PORT ?? '8080'}`;
    }

    getModuleUrl(moduleName: string) {
        return new URL(`./modules/${moduleName}.js`, import.meta.url).toString();
    }
}

export const runtime = new TestRuntime();
