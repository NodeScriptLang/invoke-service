import assert from 'assert';

import { createConditionalSandbox } from '../main/sandbox.js';

describe('sandbox', () => {

    const original = {
        foo: 123,
        bar() {
            return 'Hello';
        },
    };

    const sandbox = createConditionalSandbox(original, {
        foo: 345,
        bar() {
            return 'Bye';
        },
    }, () => {
        const { stack = '' } = new Error();
        return stack.includes('knownFunctionName');
    });

    function knownFunctionName(fn: () => any) {
        return fn();
    }

    it('returns stub when condition is not met', () => {
        assert.strictEqual(sandbox.foo, 345);
    });

    it('returns original when condition is met', () => {
        const foo = knownFunctionName(() => sandbox.foo);
        assert.strictEqual(foo, 123);
    });

});
