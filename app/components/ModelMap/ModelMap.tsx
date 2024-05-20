import { useEffect, useRef, useState } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import classes from "./ModelMap.module.css";
import { Flight } from "~/db/scenario";

mapboxgl.accessToken = 'pk.eyJ1IjoiYnJvYWR3ZWxsIiwiYSI6ImNrODYzNms2YTAzcGgzbHA5N2ozb3MwMG0ifQ.sextysOi4arKEtWX7TFxGg';

export interface MapProps {
  flights: Flight[];
  time: Date;
  airportLocations: Record<string, {lat:number, lng:number}>;
  disruptions: DisplayedDisruption[];
}

export interface DisplayedDisruption {
  location: string;
  description: string;
  hourlyRate: number;
  reason: string;
  start: string;
  end: string;
}

function flightLocation(flight: Flight, props: MapProps): {lat: number, lng: number} {
  const fracCompleted = 
    Math.min(1, (props.time.getTime() - flight.start) / (flight.end - flight.start));
  const originLoc = props.airportLocations[flight.origin];
  const destLoc = props.airportLocations[flight.dest];
  if (originLoc === undefined || destLoc === undefined || isNaN(fracCompleted)) {
    console.error('Invalid flight for location finding', flight);
  }
  return {
    lat: originLoc.lat * (1 - fracCompleted) + destLoc.lat * fracCompleted,
    lng: originLoc.lng * (1 - fracCompleted) + destLoc.lng * fracCompleted,
  };
}

export default function ModelMap({ flights, airportLocations, time, disruptions }: MapProps) {
    const container = useRef(null);
    const map = useRef<Map|null>(null);
    const [lng, setLng] = useState(-96.0115);
    const [lat, setLat] = useState(37.7762);
    const [zoom, setZoom] = useState(4);
    const [airportMarkers, setAirportMarkers] = useState<{[code: string]: mapboxgl.Marker}>({});
    const [flightMarkers, setFlightMarkers] = useState<mapboxgl.Marker[]>([]);

    // Initialize the map
    useEffect(() => {
      if (map.current) return;
      if (!container.current) return;
      map.current = new mapboxgl.Map({
        container: container.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [lng, lat],
        zoom,
        maxZoom: 7,
        minZoom: 3
      });

      map.current.on('move', () => {
        setLat(map.current!.getCenter().lat);
        setLng(map.current!.getCenter().lng);
        setZoom(map.current!.getZoom());
      });
    });

    useEffect(() => {
      if (!map.current) return;
      for (const marker in airportMarkers) {
        airportMarkers[marker].remove();
      }
      const newAirportMarkers: {[code: string]: mapboxgl.Marker} = {};
      for (const code in airportLocations) {
        const elem = document.createElement('div');
        elem.classList.add(classes['airport-marker']);
        elem.innerText = code;
        const marker = new mapboxgl.Marker(elem).setLngLat(airportLocations[code]).addTo(map.current!);
        newAirportMarkers[code] = marker;
      }
      setAirportMarkers(newAirportMarkers);
    }, [airportLocations, map]);

    useEffect(() => {
      if (Object.keys(airportMarkers).length === 0) return;
      for (const code in airportLocations) {
        const disruptionIndex = disruptions.find(d => d.location === code && time.getTime() > new Date(d.start).getTime() && time.getTime() < new Date(d.end).getTime());
        const elem = airportMarkers[code].getElement();
        if (disruptionIndex !== undefined) {
          elem.classList.add(classes['airport-disrupted']);
        } else {
          elem.classList.remove(classes['airport-disrupted']);
        }
      }
    }, [time, disruptions, airportMarkers]);

    useEffect(() => {
      if (!map.current) return;
      for (const marker of flightMarkers) {
        marker.remove();
      }
      const newFlightMarkers: mapboxgl.Marker[] = [];
      for (const flight of flights) {
        if (!flight.cancelled) {
          const elem = document.createElement('div');
          elem.classList.add(classes['flight-marker']);
          if (flight.end - flight.sched_end > 1000 * 60 * 15) {
            elem.classList.add(classes['delayed']);
          }
          const marker = new mapboxgl.Marker(elem).setLngLat(flightLocation(flight, { flights, airportLocations, time, disruptions })).addTo(map.current!);
          newFlightMarkers.push(marker);
        }
      }
      setFlightMarkers(newFlightMarkers);
    }, [flights, airportLocations, time]);

    return <div>
      <div className={classes['map-container']} ref={container} />
    </div>;
  }