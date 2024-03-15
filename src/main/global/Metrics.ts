import { CounterMetric, DynamicGaugeMetric, GaugeMetric, HistogramMetric, metric } from '@nodescript/metrics';

const process = global.process;

const EXTENDED_LATENCY_BUCKETS = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5,
    1, 2.5, 5, 10, 20, 30, 60,
    90, 120, 180, 240, 300, 600, 900, 1200
];

export class Metrics {

    @metric()
    invocationLatency = new HistogramMetric<{}>(
        'nodescript_invoke_latency_seconds', 'Invoke Latency', EXTENDED_LATENCY_BUCKETS);

    @metric()
    invocations = new CounterMetric<{}>(
        'nodescript_invoke_invocations_total', 'Total Invocations');

    @metric()
    moduleResolutions = new GaugeMetric<{}>(
        'nodescript_invoke_module_resolutions_total', 'Total Module Resolutions');

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
