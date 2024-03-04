export function convertResponseStatus(status: number) {
    if (status >= 100 && status <= 599) {
        return status;
    }
    return 500;
}
