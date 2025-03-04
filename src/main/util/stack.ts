export interface StackItem {
    symbol: string;
    source: string;
}

export function parseStack(stack: string): StackItem[] {
    const lines = stack.split('\n').filter(line => line.trim().startsWith('at'));
    const result: StackItem[] = [];
    for (const line of lines) {
        const match = /^\s*at(?:\s+async)?\s+(\S+)\s+\((.*)\)$/.exec(line);
        if (!match) {
            continue;
        }
        result.push({
            symbol: match[1] ?? '',
            source: match[2] ?? '',
        });
    }
    return result;
}

export function findErrorLocation(stack: StackItem[]): string {
    // A *reversed* error stack produced by a typical graph will contain the following entries:
    // - root:result — outer-most Output node
    // - root:<node1> — subgraph 1
    // - root:<node1>:result — Output of subgraph 1
    // - root:<node1>:<node2> — subgraph 2
    // - root:<node1>:<node2>:result — Output of subgraph 2
    // - ...
    // - root:<node1>:...:<nodeN> — the node that threw the error <-- this is what we want to find
    // - something else, e.g. a call to a dependency
    // In other words, we need to find the last entry before leaving the inner-most scope.
    const reversedStack = [...stack].reverse();
    let lastSym = '';
    let currentScope: string[] = [];
    for (const { symbol } of reversedStack) {
        if (!symbol.startsWith('root:')) {
            continue;
        }
        const components = symbol.split(':');
        for (const [i, scopeItem] of currentScope.entries()) {
            if (components[i] !== scopeItem) {
                // We left the outer graph scope
                return lastSym;
            }
        }
        currentScope = components.slice(0, components.length - 1);
        lastSym = symbol;
    }
    return lastSym;
}
