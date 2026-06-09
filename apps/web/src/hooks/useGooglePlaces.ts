'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;
let googlePromise: Promise<typeof google> | null = null;

function getLoader() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  if (!loaderInstance) {
    loaderInstance = new Loader({ apiKey, version: 'weekly', libraries: ['places'] });
  }
  if (!googlePromise) {
    googlePromise = loaderInstance.load().catch((err) => {
      // Reset so a subsequent mount can retry instead of reusing the rejected promise
      googlePromise = null;
      throw err;
    });
  }
  return googlePromise;
}

export function useGooglePlaces() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    let cancelled = false;
    const div = document.createElement('div');
    document.body.appendChild(div);

    getLoader()
      .then((g) => {
        if (cancelled) return;
        serviceRef.current = new g.maps.places.PlacesService(div);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      // Guard against double-cleanup in StrictMode
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  }, []);

  function nearbySearch(
    request: google.maps.places.PlaceSearchRequest,
  ): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      if (!serviceRef.current) return reject(new Error('Service not ready'));
      serviceRef.current.nearbySearch(request, (results, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK ||
          status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          resolve(results ?? []);
        } else {
          reject(new Error(status));
        }
      });
    });
  }

  function getDetails(
    request: google.maps.places.PlaceDetailsRequest,
  ): Promise<google.maps.places.PlaceResult> {
    return new Promise((resolve, reject) => {
      if (!serviceRef.current) return reject(new Error('Service not ready'));
      serviceRef.current.getDetails(request, (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(status));
        }
      });
    });
  }

  return { ready, loadError, nearbySearch, getDetails };
}
