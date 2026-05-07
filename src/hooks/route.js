// app/api/geolocation/route.js
import { NextResponse } from 'next/server';

// Cache for 1 hour to avoid rate limits
const CACHE_DURATION = 60 * 60; // 1 hour in seconds

export async function GET(request) {
  try {
    // Get client IP from headers (works with proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // For localhost development, use a fallback
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment || clientIp === 'unknown' || clientIp.includes('127.0.0.1') || clientIp.includes('::1')) {
      // Return a default location for development
      return NextResponse.json({
        lat: 30.3322,
        lng: -81.6557,
        city: 'Jacksonville',
        region: 'FL',
        displayText: 'Jacksonville, FL',
        timezone: 'America/New_York',
      }, {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      });
    }

    // Try ipapi.co first (free tier: 1000 requests/day, 30k/month)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        headers: {
          'User-Agent': 'ClassEasily/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        return NextResponse.json({
          lat: data.latitude,
          lng: data.longitude,
          city: data.city,
          region: data.region_code,
          displayText: `${data.city}, ${data.region_code}`,
          timezone: data.timezone,
        }, {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
          },
        });
      }
    } catch (error) {
      console.warn('ipapi.co failed, trying fallback:', error.message);
    }

    // Fallback to ip-api.com (free, no key required, 45 requests/minute)
    try {
      const fallbackResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,lat,lon,city,region,timezone`);
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        
        if (data.status === 'success') {
          return NextResponse.json({
            lat: data.lat,
            lng: data.lon,
            city: data.city,
            region: data.region,
            displayText: `${data.city}, ${data.region}`,
            timezone: data.timezone,
          }, {
            headers: {
              'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
            },
          });
        }
      }
    } catch (error) {
      console.warn('ip-api.com failed:', error.message);
    }

    // Final fallback - return default location
    return NextResponse.json({
      lat: 30.3322,
      lng: -81.6557,
      city: 'Jacksonville',
      region: 'FL',
      displayText: 'Jacksonville, FL',
      timezone: 'America/New_York',
    }, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    });

  } catch (error) {
    console.error('Geolocation API error:', error);
    
    // Return default location on error
    return NextResponse.json({
      lat: 30.3322,
      lng: -81.6557,
      city: 'Jacksonville',
      region: 'FL',
      displayText: 'Jacksonville, FL',
      timezone: 'America/New_York',
    }, {
      status: 200, // Return 200 even on error with fallback data
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    });
  }
}