// hooks/useIpGeolocation.js
import { useState, useEffect } from 'react';

// Using ipapi.co - free, no-key-required IP geolocation API
// Rate limit: 1,000 requests per day for free tier
const IP_GEOLOCATION_API_URL = 'https://ipapi.co/json/';

export const useIpGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // SSR check - don't run on server
    if (typeof window === 'undefined') {
      return;
    }

    // Check for cached location in sessionStorage
    const cachedLocation = sessionStorage.getItem('userGeolocation');
    const cacheTimestamp = sessionStorage.getItem('userGeolocationTimestamp');
    
    // Use cache if it's less than 1 hour old (to respect API rate limits)
    if (cachedLocation && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
      const oneHour = 60 * 60 * 1000;
      
      if (cacheAge < oneHour) {
        try {
          const parsedLocation = JSON.parse(cachedLocation);
          setLocation(parsedLocation);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse cached location:', e);
          // Continue to fetch fresh data
        }
      }
    }

    const fetchLocation = async () => {
      setLoading(true);
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(IP_GEOLOCATION_API_URL, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`IP Geolocation API failed with status: ${response.status}`);
        }
        
        const data = await response.json();

        // Check if we got valid data
        if (data && data.latitude && data.longitude) {
          const locationData = {
            lat: data.latitude,
            lng: data.longitude,
            city: data.city || '',
            region: data.region_code || '', // e.g., "ON"
            country: data.country_name || '',
            displayText: `${data.city || 'Unknown'}, ${data.region_code || 'Unknown'}`,
            timezone: data.timezone || '',
          };
          
          setLocation(locationData);
          setError(null);
          
          // Cache the result in sessionStorage
          try {
            sessionStorage.setItem('userGeolocation', JSON.stringify(locationData));
            sessionStorage.setItem('userGeolocationTimestamp', Date.now().toString());
          } catch (e) {
            console.warn('Failed to cache location:', e);
            // Continue anyway - caching is optional
          }
        } else {
          throw new Error('Invalid data received from IP Geolocation API');
        }
      } catch (err) {
        // Don't log errors in production to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.error("IP Geolocation Error:", err);
        }
        setError(err);
        
        // Set Toronto as fallback location
        const fallbackLocation = {
          lat: 43.6532,
          lng: -79.3832,
          city: 'Toronto',
          region: 'ON',
          country: 'Canada',
          displayText: 'Toronto, ON',
          timezone: 'America/Toronto',
        };
        
        setLocation(fallbackLocation);
      } finally {
        setLoading(false);
      }
    };

    // Defer fetch to not block initial render - use requestIdleCallback if available
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      const idleId = window.requestIdleCallback(fetchLocation, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    } else {
      // Fallback: delay by 500ms to let initial render complete
      const timeoutId = setTimeout(fetchLocation, 500);
      return () => clearTimeout(timeoutId);
    }
  }, []); // Empty dependency array ensures this runs only once

  return { location, loading, error };
};