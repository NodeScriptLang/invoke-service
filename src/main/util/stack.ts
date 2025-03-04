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
