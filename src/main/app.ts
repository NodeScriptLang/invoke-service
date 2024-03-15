import { HttpErrorHandler, HttpMetricsHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { BaseApp, StandardLogger } from '@nodescript/microframework';
import { createServer } from 'http';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';
import { AddressInfo } from 'net';

import { InvokeHandler } from './global/InvokeHandler.js';
import { LivenessHandler } from './global/LivenessHandler.js';
import { MainHttpServer } from './global/MainHttpServer.js';
import { Metrics } from './global/Metrics.js';
import { ModuleResolver } from './global/ModuleResolver.js';
import { StatusHandler } from './global/StatusHandler.js';
import { enableSandbox } from './sandbox.js';

export class App extends BaseApp {

    @dep() private mainHttpServer!: MainHttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(Logger, StandardLogger);
        this.mesh.service(Metrics);
        this.mesh.service(MainHttpServer);
        this.mesh.service(HttpMetricsHandler);
        this.mesh.service(HttpErrorHandler);
        this.mesh.service(InvokeHandler);
        this.mesh.service(StatusHandler);
        this.mesh.service(LivenessHandler);
        this.mesh.service(ModuleResolver);
    }

    override async start() {
        await super.start();
        await this.initFetch();
        enableSandbox();
        await this.mainHttpServer.start();
    }

    override async stop() {
        await super.stop();
        await this.mainHttpServer.stop();
    }

    private async initFetch() {
        // In Node.js Undici is initialized lazily, which intereferes with sandboxing
        // This allows initializing it before applying the sandbox
        const server = createServer((req, res) => res.writeHead(204).end()).listen();
        const port = (server.address() as AddressInfo).port;
        await fetch(`http://127.0.0.1:${port}`);
        server.close();
    }

}
