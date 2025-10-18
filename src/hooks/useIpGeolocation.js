// hooks/useIpGeolocation.js
import { useState, useEffect } from 'react';

export const useIpGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // FIXED: Add SSR check
    if (typeof window === 'undefined') {
      return;
    }

    // Check if we have cached location in sessionStorage
    const cachedLocation = sessionStorage.getItem('userGeolocation');
    const cacheTimestamp = sessionStorage.getItem('userGeolocationTimestamp');
    
    // Use cache if it's less than 1 hour old
    if (cachedLocation && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
      const oneHour = 60 * 60 * 1000;
      
      if (cacheAge < oneHour) {
        setLocation(JSON.parse(cachedLocation));
        setLoading(false);
        return;
      }
    }

    const fetchLocation = async () => {
      setLoading(true);
      try {
        // Use our Next.js API route
        const response = await fetch('/api/geolocation', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Geolocation API failed with status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.lat && data.lng) {
          const locationData = {
            lat: data.lat,
            lng: data.lng,
            city: data.city,
            region: data.region,
            displayText: data.displayText,
            timezone: data.timezone,
          };
          
          setLocation(locationData);
          
          // Cache the result in sessionStorage
          sessionStorage.setItem('userGeolocation', JSON.stringify(locationData));
          sessionStorage.setItem('userGeolocationTimestamp', Date.now().toString());
        } else {
          throw new Error('Invalid data received from geolocation API');
        }
      } catch (err) {
        console.error("IP Geolocation Error:", err);
        setError(err);
        
        // FIXED: Set Toronto as default fallback (matching BannerSearch)
        const fallbackLocation = {
          lat: 43.6532,
          lng: -79.3832,
          city: 'Toronto',
          region: 'ON',
          displayText: 'Toronto, ON',
          timezone: 'America/Toronto',
        };
        
        setLocation(fallbackLocation);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location, loading, error };
};