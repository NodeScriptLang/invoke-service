import { GraphEvalContext } from '@nodescript/core/runtime';
import { FetchMethod } from '@nodescript/core/types';
import { createServer } from 'http';
import { AddressInfo } from 'net';

export async function compute(params: { name: string }, ctx: GraphEvalContext) {
    const server = createServer((req, res) => {
        res.end(`Hello, ${params.name}`);
    });
    try {
        const address = await new Promise<AddressInfo>(resolve => {
            server.listen(0, () => {
                resolve(server.address() as AddressInfo);
            });
        });
        const url = `http://localhost:${address.port}`;
        const res = await ctx.lib.fetch({
            url,
            method: FetchMethod.GET,
            headers: {},
        }, undefined);
        return res.body;
    } finally {
        server.close();
        server.closeAllConnections();
    }
}
