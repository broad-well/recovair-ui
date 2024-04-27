
export interface Flight {
    start: number;
    end: number;
    sched_start: number;
    sched_end: number;
    origin: string;
    dest: string;
    flight_number: string
    tail: string
    cancelled: boolean
}

export interface PassengerItineraryGroup {
    path: string[];
    count: number;
    flights: number[];
}

