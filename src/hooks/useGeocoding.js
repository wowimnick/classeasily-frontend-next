import { useState, useEffect } from 'react';

// AWS Geocoding Lambda URL (same as used in FindClass)
const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

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
        console.log(response);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const location = data[0];
          
          // Extract city and state directly from the response fields
          const city = location.city || location.locality || location.place || 'Unknown';
          const state = location.state || location.region || location.administrativeArea || '';
          
          // Format as "City, State" or just "City" if no state
          setLocationName(`${city}${state ? `, ${state}` : ''}`);
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
