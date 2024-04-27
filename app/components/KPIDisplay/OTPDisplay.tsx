import { BarChart, LineChart } from "@mantine/charts";
import { Grid, Group, Paper, Text } from "@mantine/core";
import { useMemo } from "react";
import { FullModelExport } from "~/abm/abm";


export default function OTPDisplay({ model }: { model: FullModelExport }) {
    const buckets = useMemo(() => {
        const maxDelay = model.metrics.delays.reduce((a, b) => Math.max(a, b));
        const bucketCount = 5;
        const findBucket = (delay: number) => Math.floor((delay - 15) / maxDelay * bucketCount);
        const buckets: number[] = [];
        for (let i = 0; i < bucketCount + 1; ++i) buckets[i] = 0;
        for (const delay of model.metrics.delays) {
            if (delay > 15) {
                ++buckets[findBucket(delay) + 1];
            } else {
                ++buckets[0];
            }
        }
        return buckets.map((bucket, i) => ({
            bucket: i === 0 ? 'On time' : `${Math.round(15 + (maxDelay - 15) / bucketCount * (i - 1))}-${Math.round(15 + (maxDelay - 15) / bucketCount * i)}`,
            frequency: bucket
        }));
    }, [model]);
    const otPercent = useMemo(() => {
        return (100 * model.metrics.delays.filter(i => i <= 15).length / model.metrics.delays.length).toFixed(4);
    }, [model]);

    return <Paper withBorder p="lg">
        <Grid>
            <Grid.Col span={7}>
                <h3 style={{marginBottom: 0}}>Overall simulated OTP</h3>
                <h2 style={{margin: 0}}><pre>{otPercent}%</pre></h2>
                <p>On-time performance (arrival within 15-minutes of scheduled arrive time means on-time) over the scenario</p>
            </Grid.Col>
            <Grid.Col span={5}>
                <BarChart h={200}
                    data={buckets}
                    dataKey="bucket"
                    series={[{name: 'frequency', color: 'blue.4'}]} />
            </Grid.Col>
        </Grid>
    </Paper>;
}