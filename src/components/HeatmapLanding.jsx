import React, { useRef, useEffect } from "react";
import { supabase } from "../supabase";

export default function HeatmapLanding({ onReady }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css";
      document.head.appendChild(link);
    }
    import("mapbox-gl").then(async ({ default: mapboxgl }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-98, 30],
        zoom: window.innerWidth < 640 ? 2.2 : 3.3,
        interactive: false,
        attributionControl: true,
      });
      map.on("load", async () => {
        mapInst.current = map;
        const [{ data: postData }, { data: seedData }] = await Promise.all([
          supabase.from("posts").select("lat, lng").not("lat", "is", null).not("lng", "is", null),
          supabase.from("seed_hotspots").select("lat, lng"),
        ]);
        const combined = [...(postData || []), ...(seedData || [])];
        if (!combined.length) { onReady?.(); return; }
        map.addSource("hotspots", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: combined.map(p => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] } }))
          }
        });
        map.addLayer({
          id: "hotspots-glow-outer",
          type: "circle",
          source: "hotspots",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 10, 6, 20],
            "circle-color": "#ff4422",
            "circle-opacity": 0.18,
            "circle-blur": 0.6,
            "circle-stroke-width": 0,
          }
        });
        map.addLayer({
          id: "hotspots-glow",
          type: "circle",
          source: "hotspots",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 6, 10],
            "circle-color": "#ff2200",
            "circle-opacity": 1,
            "circle-blur": 0,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ff6644",
            "circle-stroke-opacity": 1,
          }
        });
        onReady?.();
      });
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, []);

  return <div ref={mapRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}
