const sandboxSymbol = Symbol('NodeScript Sandbox');

const process = global.process;
const console = global.console;

const processStub = {
    env: {},
    nextTick: (cb: any, ...args: any[]) => process.nextTick(cb, ...args),
};

const consoleStub: any = {};
for (const k of Object.keys(console)) {
    consoleStub[k] = () => {};
}

/**
 * Stubs globals that are unsafe to expose to module runtime.
 * This permanently removes them from globals and makes global frozen.
 */
export function enableSandbox() {
    if ((globalThis as any)[sandboxSymbol]) {
        // Already sandboxed
        return;
    }
    Object.assign(globalThis, {
        process: createConditionalSandbox(process, processStub, sandboxCondition),
        console: createConditionalSandbox(console, consoleStub, sandboxCondition),
        [sandboxSymbol]: true,
    });
    Object.freeze(globalThis);
}

export function createConditionalSandbox<T extends object>(target: T, stub: any, returnOriginal: () => boolean) {
    return new Proxy(target, {
        get(target, key, receiver) {
            return returnOriginal() ?
                Reflect.get(target, key, receiver) :
                Reflect.get(stub, key, stub);
        }
    });
}

// In tests skip sandboxing for Mocha and Dotenv code

const sourceAllowList = [
    '/out/test/',
    '/node_modules/mocha/',
    '/node_modules/dotenv/',
];

function sandboxCondition() {
    if (process.env.NODE_ENV === 'test') {
        const { stack = '' } = new Error();
        const sources = stack.split(/\n+/)
            .slice(2)
            .map(_ => {
                const match = /^\s+at\s+.*?\((.*?)\)$/.exec(_);
                return match ? match[1] : '';
            });
        return sourceAllowList.some(sym => sources.some(source => source.includes(sym)));
    }
    return false;
}
