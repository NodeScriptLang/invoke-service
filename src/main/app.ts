import { AuxHttpServer, BaseApp } from '@nodescript/microframework';
import { createServer } from 'http';
import { dep, Mesh } from 'mesh-ioc';
import { AddressInfo } from 'net';

import { InvokeHandler } from './global/InvokeHandler.js';
import { MainHttpServer } from './global/MainHttpServer.js';
import { Metrics } from './global/Metrics.js';
import { ModuleResolver } from './global/ModuleResolver.js';
import { UptimeChecker } from './global/UptimeChecker.js';
import { enableSandbox } from './sandbox.js';

export class App extends BaseApp {

    @dep() private mainHttpServer!: MainHttpServer;
    @dep() private auxHttpServer!: AuxHttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.service(MainHttpServer);
        this.mesh.service(AuxHttpServer);
        this.mesh.service(InvokeHandler);
        this.mesh.service(ModuleResolver);
        this.mesh.service(UptimeChecker);
        this.mesh.service(Metrics);
    }

    override async start() {
        await super.start();
        await this.initFetch();
        enableSandbox();
        await this.mainHttpServer.start();
        await this.auxHttpServer.start();
    }

    override async stop() {
        await super.stop();
        await this.mainHttpServer.stop();
        await this.auxHttpServer.stop();
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
