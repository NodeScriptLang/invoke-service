import { RequestSpec, ResponseSpec } from '@nodescript/core/schema';

export function compute(params: { $request: RequestSpec }) {
    const $response: ResponseSpec = {
        status: 200,
        headers: {},
        body: `Hello, ${params.$request.query.name}`,
        attributes: {},
    };
    return { $response };
}
