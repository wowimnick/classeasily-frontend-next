import { useState, useEffect } from 'react';
import {
  AWS_LOCATION_API_URL,
  parseAlsLocationResult,
} from '@/lib/awsLocation';

export const useGeocoding = (coordinates) => {
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getLocationName = async () => {
      if (!coordinates) {
        setLoading(false);
        return;
      }

      try {
        const [lat, lng] = coordinates.split(',').map(coord => coord.trim());
        
        // Use reverse geocoding endpoint with lat/lng parameters
        const response = await fetch(
          `${AWS_LOCATION_API_URL}?lat=${lat}&lng=${lng}&reverse=true`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const parsed = parseAlsLocationResult(data[0]);
          setLocationName(parsed?.displayText || 'Unknown Location');
        } else {
          setLocationName('Unknown Location');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('AWS Geocoding error:', error);
        setError(error);
        setLocationName('Unknown Location');
        setLoading(false);
      }
    };

    getLocationName();
  }, [coordinates]);

  return { locationName, loading, error };
};
