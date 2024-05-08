import assert from 'assert';

import { runtime } from './runtime.js';

describe('Invoke', () => {

    it('returns the expected response from module', async () => {
        const res = await fetch(runtime.baseUrl + '/invoke', {
            method: 'POST',
            headers: {
                'ns-module-url': runtime.getModuleUrl('HelloService'),
            },
            body: JSON.stringify({
                name: 'World',
            }),
        });
        const text = await res.text();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(text, 'Hello, World');
    });

    it('returns 499 when module is not specified', async () => {
        const res = await fetch(runtime.baseUrl + '/invoke', { method: 'POST' });
        assert.strictEqual(res.status, 499);
        const json: any = await res.json();
        assert.strictEqual(json.name, 'PreconditionFailedError');
    });

    it('returns 500 when module URL is unspecified', async () => {
        const res = await fetch(runtime.baseUrl + '/invoke', {
            method: 'POST',
            headers: {
                'ns-module-url': runtime.getModuleUrl('Unknown'),
            }
        });
        const json: any = await res.json();
        assert.strictEqual(json.name, 'PreconditionFailedError');
    });

    it('returns custom response', async () => {
        const res = await fetch(runtime.baseUrl + '/invoke', {
            method: 'POST',
            headers: {
                'ns-module-url': runtime.getModuleUrl('RedirectService'),
            },
            body: JSON.stringify({
                redirectUrl: 'https://example.com',
            }),
            redirect: 'manual',
        });
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get('location'), 'https://example.com');
        const text = await res.text();
        assert.strictEqual(text, '');
    });

    it('returns binary', async () => {
        const res = await fetch(runtime.baseUrl + '/invoke', {
            method: 'POST',
            headers: {
                'ns-module-url': runtime.getModuleUrl('BinaryService'),
            },
            body: '',
        });
        assert.strictEqual(res.status, 200);
        const buf = await res.arrayBuffer();
        assert.strictEqual(res.headers.get('content-length'), '5');
        assert.deepStrictEqual(new Uint8Array(buf), new Uint8Array([0, 1, 2, 3, 4]));
    });

});
