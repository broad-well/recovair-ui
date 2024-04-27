import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const abm = require('./index.node');

import env from "~/env";
import { Flight, PassengerItineraryGroup } from "~/db/scenario";

export interface FullModelExport {
    flights: Record<number, Flight>;
    fleet: Record<string, string>;
    demands: Record<string, PassengerItineraryGroup>;
    metrics: {
        delays: number[];
        // on time, total, cancelled
        otp: {[time: string]: [number, number, number]};
        dep_delay_reasons: {[reason: string]: number};
        arr_delay_reasons: {[reason: string]: number};
    }
}

export default class FinishedModel {
    model: unknown;
    fullExport: FullModelExport;

    constructor(sid: string) {
        this.model = abm.runModel(env.database, sid);
        this.fullExport = abm.readModel(this.model) as FullModelExport;
    }

    readFullModel(): FullModelExport {
        return this.fullExport;
    }
}