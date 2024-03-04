import { HttpServer } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { BaseApp, StandardLogger } from '@nodescript/microframework';
import { createServer } from 'http';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';
import { AddressInfo } from 'net';

import { InvokeHttpHandler } from './InvokeHttpHandler.js';
import { enableSandbox } from './sandbox.js';

export class App extends BaseApp {

    @dep() private httpServer!: HttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.constant(HttpServer.SCOPE, () => this.createSessionScope());
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(Logger, StandardLogger);
        this.mesh.service(HttpServer);
        this.mesh.service(InvokeHttpHandler);
        this.mesh.alias(HttpServer.HANDLER, InvokeHttpHandler);
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
