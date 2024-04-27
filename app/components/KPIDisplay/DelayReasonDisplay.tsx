import { PieChart } from "@mantine/charts";
import { Grid, Paper } from "@mantine/core";
import { useMemo } from "react";
import { FullModelExport } from "~/abm/abm";

export default function DelayReasonDisplay(props: {model: FullModelExport}) {
    const pieData = useMemo(() => {
        const colorPalette = [
            'indigo.6',
            'orange.5',
            'lime.5',
            'red.5'
        ];
        const categories: Record<string, number> = {
            'RateLimited': 0,
            'Disrupted': 0,
            'CrewShortage': 0,
            'AircraftShortage': 0
        }
        for (const reason in props.model.metrics.dep_delay_reasons) {
            categories[reason.split('(')[0]] += props.model.metrics.dep_delay_reasons[reason];
        }
        return Object.entries(categories)
            .map(([category, amount], i) => ({ name: category, value: amount, color: colorPalette[i] }));
    }, [props.model]);
    console.log(pieData);

    return <Paper withBorder p="lg">
        <Grid>
            <Grid.Col span={7}>
                <h2>Distribution of delay by reason</h2>
                <p>Minutes delayed due to crew shortage, aircraft shortage, disruption, or airport rate limit</p>
            </Grid.Col>
            <Grid.Col span={5}>
                <PieChart data={pieData} withTooltip />
            </Grid.Col>
        </Grid>
    </Paper>
}