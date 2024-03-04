import { HttpMetricsHandler, HttpServer } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { BaseApp, StandardLogger } from '@nodescript/microframework';
import { createServer } from 'http';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';
import { AddressInfo } from 'net';

import { AppHandler } from './AppHandler.js';
import { InvokeHandler } from './InvokeHandler.js';
import { LivenessHandler } from './LivenessHandler.js';
import { Metrics } from './Metrics.js';
import { ModuleResolver } from './ModuleResolver.js';
import { enableSandbox } from './sandbox.js';
import { StatusHandler } from './StatusHandler.js';

export class App extends BaseApp {

    @dep() private httpServer!: HttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.constant(HttpServer.SCOPE, () => this.createSessionScope());
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(Logger, StandardLogger);
        this.mesh.service(HttpServer);
        this.mesh.service(HttpMetricsHandler);
        this.mesh.service(AppHandler);
        this.mesh.service(ModuleResolver);
        this.mesh.service(InvokeHandler);
        this.mesh.service(StatusHandler);
        this.mesh.service(LivenessHandler);
        this.mesh.service(Metrics);
        this.mesh.alias(HttpServer.HANDLER, AppHandler);
    }

    createSessionScope() {
        const mesh = new Mesh('Request');
        mesh.parent = this.mesh;
        return mesh;
    }

    override async start() {
        await super.start();
        await this.initFetch();
        enableSandbox();
        await this.httpServer.start();
    }

    override async stop() {
        await super.stop();
        await this.httpServer.stop();
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
