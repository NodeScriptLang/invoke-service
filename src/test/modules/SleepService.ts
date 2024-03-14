export async function compute(_params: {}) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'Hi';
}
