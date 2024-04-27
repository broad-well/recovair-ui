import sqlite from "better-sqlite3";
import env from "~/env";
import { parse } from "date-fns/parse";
import { DisplayedDisruption } from "~/components/ModelMap/ModelMap";

export interface ScenarioConfig {
    start: Date;
    end: Date;
}

function parseDatabaseTime(time: string): Date {
    return parse(time + 'Z', "yyyy-MM-dd HH:mm:ssX", new Date(2024, 0, 1, 0, 0, 0));
}

export function listScenarioIDs(): string[] {
    const db = sqlite(env.database);
    const result = db.prepare('SELECT sid FROM scenarios').all().map(i => i.sid) as string[];
    db.close();
    return result;
}

export default class Database {
    db: sqlite.Database

    constructor(private sid: string) {
        this.db = sqlite(env.database);
        this.db.pragma('journal_mode = WAL');
    }

    readScenarioConfig(): ScenarioConfig {
        const row = this.db.prepare('SELECT start_time, end_time FROM scenarios WHERE sid = ?').get(this.sid) as {start_time: string, end_time: string};
        return {
            start: parseDatabaseTime(row.start_time),
            end: parseDatabaseTime(row.end_time)
        }
    }

    readAirports(): string[] {
        const rows = this.db.prepare('SELECT code FROM airports WHERE sid = ?').all(this.sid) as {code: string}[];
        return rows.map(i => i.code);
    }

    readDisruptions(): DisplayedDisruption[] {
        const rows = this.db.prepare("SELECT airport, start, end, hourly_rate, type, reason FROM disruptions WHERE sid = ?").all(this.sid);
        return rows.map(row => ({
            location: row.airport,
            description: row.type,
            hourlyRate: row.hourly_rate,
            reason: row.reason,
            start: parseDatabaseTime(row.start),
            end: parseDatabaseTime(row.end)
        }));
    }

    readAirportLatLong(airports: string[]): Record<string, {lat: number, lng: number}> {
        const map: {[code: string]: {lat: number, lng: number}} = {};
        const stmt = this.db.prepare('SELECT latitude, longitude FROM airports WHERE sid = ? AND code = ?');
        for (const airport of airports) {
            const val = stmt.get(this.sid, airport) as {latitude: number, longitude: number};
            if (val != null) {
                map[airport] = {
                    lat: val.latitude,
                    lng: val.longitude
                };
            }
        }
        return map;
    }

    close(): void {
        this.db.close();
    }
}