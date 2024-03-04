import assert from 'assert';

import { runtime } from './runtime.js';

describe('Invoke', () => {

    it('returns the expected response from Hello Service', async () => {
        const res = await fetch(runtime.baseUrl + '?name=World', {
            headers: {
                'ns-module-url': runtime.getModuleUrl('HelloService'),
            }
        });
        const text = await res.text();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(text, 'Hello, World');
    });

    it('returns undefined text from Hello Service when param name is incorrect', async () => {
        const res = await fetch(runtime.baseUrl + '?foo=World', {
            headers: {
                'ns-module-url': runtime.getModuleUrl('HelloService'),
            }
        });
        const text = await res.text();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(text, 'Hello, undefined');
    });

    it('returns 499 when module is not specified', async () => {
        const res = await fetch(runtime.baseUrl + '?name=World');
        assert.strictEqual(res.status, 499);
        const json: any = await res.json();
        assert.strictEqual(json.name, 'PreconditionFailedError');
    });

    it('returns 500 when module URL is unspecified', async () => {
        const res = await fetch(runtime.baseUrl + '?name=World', {
            headers: {
                'ns-module-url': runtime.getModuleUrl('Unknown'),
            }
        });
        const json: any = await res.json();
        assert.strictEqual(json.name, 'PreconditionFailedError');
    });

});
