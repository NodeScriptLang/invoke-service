import { ResponseSpec } from '@nodescript/core/schema';

export function compute(params: { redirectUrl: string }) {
    const $response: ResponseSpec = {
        status: 302,
        headers: {
            'location': [params.redirectUrl],
        },
        body: ``,
        attributes: {},
    };
    return { $response };
}
