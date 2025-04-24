import { fetchStats } from '@nodescript/fetch-undici';
import { DynamicGaugeMetric, metric } from '@nodescript/metrics';

export class Metrics {

    @metric()
    outboundRequestsTotal = new DynamicGaugeMetric(
        () => [{ value: fetchStats.requests.total, labels: {} }],
        'nodescript_invoke_outbound_requests_total', 'Total outbound requests');

    @metric()
    outboundRequestsTimeout = new DynamicGaugeMetric(
        () => [{ value: fetchStats.requests.timeout, labels: {} }],
        'nodescript_invoke_outbound_requests_timeout', 'Total outbound requests timeout');

    @metric()
    outboundRequestsFailed = new DynamicGaugeMetric(
        () => [{ value: fetchStats.requests.failed, labels: {} }],
        'nodescript_invoke_outbound_requests_failed', 'Total outbound requests failed');

    @metric()
    outboundRequestsByStatus = new DynamicGaugeMetric(
        () => {
            const entries = Object.entries(fetchStats.requests.byStatus);
            return entries.map(([status, count]) => {
                return {
                    value: count,
                    labels: {
                        status: String(status)
                    }
                };
            });
        },
        'nodescript_invoke_outbound_requests_by_status', 'Total outbound requests by status');

    @metric()
    dispatcherCacheHits = new DynamicGaugeMetric(
        () => [{ value: fetchStats.dispatcherCache.hits, labels: {} }],
        'nodescript_invoke_dispatcher_cache_hits', 'Total dispatcher cache hits');

    @metric()
    dispatcherCacheMisses = new DynamicGaugeMetric(
        () => [{ value: fetchStats.dispatcherCache.misses, labels: {} }],
        'nodescript_invoke_dispatcher_cache_misses', 'Total dispatcher cache misses');

}
