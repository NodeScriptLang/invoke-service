import { ResponseSpec } from '@nodescript/core/schema';

export function compute() {
    const $response: ResponseSpec = {
        status: 200,
        headers: {},
        body: new Uint8Array([0, 1, 2, 3, 4]),
        attributes: {},
    };
    return { $response };
}
