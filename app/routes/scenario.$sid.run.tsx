import { LinksFunction, LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import FinishedModel from "~/abm/abm";
import Database from "~/db/database.server";
import IntervalTree, { Interval } from '@flatten-js/interval-tree';
import { useCallback, useMemo, useState } from "react";
import ModelMap from "~/components/ModelMap/ModelMap";
import { Flight } from "~/db/scenario";
import { ActionIcon, Center, Flex, Grid, Group, Slider } from "@mantine/core";
import OTPDisplay from "~/components/KPIDisplay/OTPDisplay";
import OTPOverTimeDisplay from "~/components/KPIDisplay/OTPOverTimeDisplay";
import DelayReasonDisplay from "~/components/KPIDisplay/DelayReasonDisplay";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";

export async function loader({params}: LoaderFunctionArgs) {
    const db = new Database(params.sid!);
    const airports = db.readAirports();
    const latlng = db.readAirportLatLong(airports);
    const config = db.readScenarioConfig();
    const disruptions = db.readDisruptions();
    db.close();

    const model = new FinishedModel(params.sid!);
    return json({
        airports: latlng,
        config,
        model: model.fullExport,
        disruptions,
    });
}

export const links: LinksFunction = () => [
    { rel: 'stylesheet', href: 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css' }
];

export default function ScenarioRun() {
    const loaded = useLoaderData<typeof loader>();
    const flightTimeline = useMemo(() => {
        const tree = new IntervalTree();
        for (const [id, flight] of Object.entries(loaded.model.flights)) {
            tree.insert(new Interval(flight.start, flight.end), id);
        }
        return tree;
    }, [loaded]);
    const [time, setTime] = useState<Date>(new Date(loaded.config.start));
    const [playing, setPlaying] = useState<NodeJS.Timeout|null>(null);

    const activeFlights = useMemo(() => {
        const flightIds = flightTimeline.search(new Interval(time.getTime(), time.getTime() + 1000*60));
        return flightIds.map(id => loaded.model.flights[id]);
    }, [flightTimeline, loaded, time]);

    const play = useCallback(
        () => setPlaying(setInterval(() => setTime(time => new Date(time.getTime() + 300 * 60 * 5)), 50)), []);
    const pause = useCallback(() => {
        clearInterval(playing!);
        setPlaying(null);
    }, [playing]);

    return <main>
        <Center><h3>{time.toUTCString()}</h3></Center>
        <ModelMap flights={activeFlights as Flight[]} time={time} airportLocations={loaded.airports} disruptions={loaded.disruptions} />
        <Grid p="lg">
            <Grid.Col span={11}>
                <Slider color="cyan"
                    min={new Date(loaded.config.start).getTime()}
                    max={new Date(loaded.config.end).getTime()}
                    label={val => new Date(val).toUTCString()}
                    onChange={val => setTime(new Date(val))}
                    value={time.getTime()} />
            </Grid.Col>
            <Grid.Col span={1}>
                <Group>
                    <ActionIcon variant="filled" aria-label="play" disabled={playing != null} onClick={play}>
                        <IconPlayerPlay />
                    </ActionIcon>
                    <ActionIcon variant="filled" aria-label="pause" disabled={playing == null} onClick={pause}>
                        <IconPlayerPause />
                    </ActionIcon>
                </Group>
            </Grid.Col>
        </Grid>
        <Grid>
            <Grid.Col span={{base: 12, md: 4}}>
                <OTPDisplay model={loaded.model} />
            </Grid.Col>
            <Grid.Col span={{base: 12, md: 4}}>
                <OTPOverTimeDisplay model={loaded.model} time={time} />
            </Grid.Col>
            <Grid.Col span={{base: 12, md: 4}}>
                <DelayReasonDisplay model={loaded.model} />
            </Grid.Col>
        </Grid>
    </main>
}