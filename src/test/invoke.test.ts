import assert from 'assert';

import { runtime } from './runtime.js';

describe('Invoke', () => {

    describe('module', () => {

        it('returns the expected response from module', async () => {
            const res = await fetch(runtime.baseUrl + '/invoke?name=World', {
                headers: {
                    'ns-module-url': runtime.getModuleUrl('HelloService'),
                }
            });
            const text = await res.text();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(text, 'Hello, World');
        });

        it('returns 499 when module is not specified', async () => {
            const res = await fetch(runtime.baseUrl + '/invoke?name=World');
            assert.strictEqual(res.status, 499);
            const json: any = await res.json();
            assert.strictEqual(json.name, 'PreconditionFailedError');
        });

        it('returns 500 when module URL is unspecified', async () => {
            const res = await fetch(runtime.baseUrl + '/invoke?name=World', {
                headers: {
                    'ns-module-url': runtime.getModuleUrl('Unknown'),
                }
            });
            const json: any = await res.json();
            assert.strictEqual(json.name, 'PreconditionFailedError');
        });

    });

    describe('variables', () => {

        it('supports variables', async () => {
            const res = await fetch(runtime.baseUrl + '/invoke', {
                headers: {
                    'ns-module-url': runtime.getModuleUrl('EchoVariableService'),
                    'ns-variables': JSON.stringify({
                        'MY_SECRET': 'some'
                    })
                },
            });
            const text = await res.text();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(text, 'MY_SECRET=some');
        });

        it('returns undefined when variables are not included', async () => {
            const res = await fetch(runtime.baseUrl + '/invoke', {
                headers: {
                    'ns-module-url': runtime.getModuleUrl('EchoVariableService'),
                },
            });
            const text = await res.text();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(text, 'MY_SECRET=undefined');
        });

    });

});
