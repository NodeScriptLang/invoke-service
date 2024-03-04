import { ResponseSpec } from '@nodescript/core/schema';

export function compute(params: { $variables: Record<string, any> }) {
    const $response: ResponseSpec = {
        status: 200,
        headers: {},
        body: `MY_SECRET=${params.$variables.MY_SECRET}`,
        attributes: {},
    };
    return { $response };
}
