import { CounterMetric, DynamicGaugeMetric, HistogramMetric, metric } from '@nodescript/metrics';

const process = global.process;

export class Metrics {

    @metric()
    invocationLatency = new HistogramMetric<{}>(
        'nodescript_invoke_latency_seconds', 'Invoke Latency');

    @metric()
    invocations = new CounterMetric<{}>(
        'nodescript_invoke_invocations_total', 'Total Invocations');

    @metric()
    cpuUsage = new DynamicGaugeMetric<{ type: string }>(() => {
        const cpuUsage = process.cpuUsage();
        return [
            { labels: { type: 'user' }, value: cpuUsage.user },
            { labels: { type: 'system' }, value: cpuUsage.system },
        ];
    }, 'nodescript_invoke_cpu_usage', 'Invoke Memory Usage');

    @metric()
    memoryUsage = new DynamicGaugeMetric<{ type: string }>(() => {
        const memoryUsage = process.memoryUsage();
        return [
            { labels: { type: 'rss' }, value: memoryUsage.rss },
            { labels: { type: 'heapUsed' }, value: memoryUsage.heapUsed },
            { labels: { type: 'heapTotal' }, value: memoryUsage.heapTotal },
            { labels: { type: 'arrayBuffers' }, value: memoryUsage.arrayBuffers },
            { labels: { type: 'external' }, value: memoryUsage.external },
        ];
    }, 'nodescript_invoke_memory_usage', 'Invoke Memory Usage');

}
