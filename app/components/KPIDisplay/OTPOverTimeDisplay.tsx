import { AreaChart, LineChart } from "@mantine/charts";
import { Grid, Group, Paper, Text } from "@mantine/core";
import { useMemo } from "react";
import { FullModelExport } from "~/abm/abm";


export default function OTPOverTimeDisplay({ model, time }: { model: FullModelExport, time: Date }) {
    const lineChartData = useMemo(() => {
        return Object.entries(model.metrics.otp)
            .filter(i => {
                return new Date(parseInt(i[0])).getTime() <= time.getTime();
            })
            .map(([date, [onTime, flown, cancelled]]) => ({
                date,
                'On time': onTime,
                'Flown': flown,
                'Cancelled': cancelled
            }));
    }, [model, time]);

    return <Paper withBorder p="lg">
        <Grid>
            <Grid.Col span={7}>
                <h3 style={{marginBottom: 0}}>OTP over time</h3>
                <p>On-time performance (arrival within 15-minutes of scheduled arrive time means on-time) over the scenario</p>
            </Grid.Col>
            <Grid.Col span={5}>
                <AreaChart h={200} data={lineChartData}
                    dataKey="date" series={[
                        { name: "On time", color: "green.5" },
                        { name: "Flown", color: "blue.4" },
                        { name: "Cancelled", color: "red.6" }
                    ]} />
            </Grid.Col>
        </Grid>
    </Paper>;
}