// hooks/useIpGeolocation.js
import { useState, useEffect } from "react";
import {
  AWS_LOCATION_API_URL,
  TORONTO_FALLBACK_LOCATION,
  getBrowserCoordinates,
  reverseGeocodeWithAls,
} from "@/lib/awsLocation";

const CACHE_KEY = "userGeolocation";
const CACHE_TS_KEY = "userGeolocationTimestamp";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readCachedLocation() {
  if (typeof window === "undefined") return null;
  try {
    const cachedLocation = sessionStorage.getItem(CACHE_KEY);
    const cacheTimestamp = sessionStorage.getItem(CACHE_TS_KEY);
    if (!cachedLocation || !cacheTimestamp) return null;
    const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
    if (cacheAge >= CACHE_TTL_MS) return null;
    return JSON.parse(cachedLocation);
  } catch {
    return null;
  }
}

function writeCachedLocation(locationData) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(locationData));
    sessionStorage.setItem(CACHE_TS_KEY, Date.now().toString());
  } catch {
    // caching is optional
  }
}

export const useIpGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cached = readCachedLocation();
    if (cached) {
      setLocation(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLocation = async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        let locationData = null;

        try {
          const coords = await getBrowserCoordinates({ timeoutMs: 5000 });
          locationData = await reverseGeocodeWithAls(coords.lat, coords.lng, {
            signal: controller.signal,
          });
        } catch {
          // Browser geolocation denied/unavailable — fall back below
        }

        clearTimeout(timeoutId);

        if (!locationData) {
          throw new Error("Could not resolve location via ALS");
        }

        if (cancelled) return;
        setLocation(locationData);
        setError(null);
        writeCachedLocation(locationData);
      } catch (err) {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.error("Geolocation Error:", err);
        }
        setError(err);
        setLocation(TORONTO_FALLBACK_LOCATION);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (typeof window !== "undefined" && window.requestIdleCallback) {
      const idleId = window.requestIdleCallback(fetchLocation, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(fetchLocation, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return { location, loading, error };
};

// Re-export for callers that need the shared ALS base URL
export { AWS_LOCATION_API_URL };
