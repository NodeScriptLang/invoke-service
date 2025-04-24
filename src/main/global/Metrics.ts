import { fetchMetrics } from '@nodescript/fetch-undici';
import { metric } from '@nodescript/metrics';

export class Metrics {

    @metric() requestsTotal = fetchMetrics.requests.total;
    @metric() requestsSent = fetchMetrics.requests.sent;
    @metric() requestsFailed = fetchMetrics.requests.failed;
    @metric() requestsTimeout = fetchMetrics.requests.timeout;
    @metric() dispatcherCacheHits = fetchMetrics.dispatcherCache.hits;
    @metric() dispatcherCacheMisses = fetchMetrics.dispatcherCache.misses;
    @metric() dnsCacheHits = fetchMetrics.dnsCache.hits;
    @metric() dnsCacheMisses = fetchMetrics.dnsCache.misses;

}
