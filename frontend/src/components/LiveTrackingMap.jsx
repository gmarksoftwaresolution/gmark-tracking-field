import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow } from '@vis.gl/react-google-maps';

// MapController manages fitBounds dynamically without forcing a controlled state
const MapController = ({ historicalRoute, liveLocation, lastKnownAddress }) => {
  const map = useMap();
  const [hasFittedRoute, setHasFittedRoute] = useState(false);

  // If the employee changes or historical route clears, reset the flag so we can fit bounds again
  useEffect(() => {
    if (!historicalRoute) {
      setHasFittedRoute(false);
    }
  }, [historicalRoute]);

  useEffect(() => {
    if (!map || hasFittedRoute) return;

    const hasUsableRoute = historicalRoute?.origin && historicalRoute?.destination;

    if (hasUsableRoute) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Include origin and destination
      bounds.extend(new window.google.maps.LatLng(historicalRoute.origin.latitude || historicalRoute.origin.lat, historicalRoute.origin.longitude || historicalRoute.origin.lng));
      bounds.extend(new window.google.maps.LatLng(historicalRoute.destination.latitude || historicalRoute.destination.lat, historicalRoute.destination.longitude || historicalRoute.destination.lng));

      // Include all checkpoints
      if (historicalRoute.checkpoints && historicalRoute.checkpoints.length > 0) {
        historicalRoute.checkpoints.forEach(cp => {
          if ((cp.latitude || cp.lat) && (cp.longitude || cp.lng)) {
            bounds.extend(new window.google.maps.LatLng(cp.latitude || cp.lat, cp.longitude || cp.lng));
          }
        });
      }

      // Include path if available
      if (historicalRoute.path && historicalRoute.path.length > 0) {
         historicalRoute.path.forEach(pt => {
             bounds.extend(new window.google.maps.LatLng(pt.lat, pt.lng));
         });
      }

      // Include all gpsPings
      if (historicalRoute.gpsPings && historicalRoute.gpsPings.length > 0) {
         historicalRoute.gpsPings.forEach(ping => {
             bounds.extend(new window.google.maps.LatLng(ping.latitude, ping.longitude));
         });
      }

      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      setHasFittedRoute(true);
    } else if (!hasUsableRoute && liveLocation) {
      // If no route, just center on live location
      map.setCenter({ lat: liveLocation.latitude, lng: liveLocation.longitude });
      map.setZoom(15);
      setHasFittedRoute(true);
    } else if (!hasUsableRoute && !liveLocation && lastKnownAddress) {
        if (lastKnownAddress.latitude && lastKnownAddress.longitude) {
            map.setCenter({ lat: lastKnownAddress.latitude, lng: lastKnownAddress.longitude });
            map.setZoom(15);
            setHasFittedRoute(true);
        }
    }
  }, [map, historicalRoute, liveLocation, lastKnownAddress, hasFittedRoute]);

  return null;
};

// RoutePolyline renders the polyline string or points
const RoutePolyline = ({ encodedPolyline, path }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const geometry = useMapsLibrary('geometry');
  const [polyline, setPolyline] = useState(null);

  useEffect(() => {
    if (!map || !maps || !geometry) return;

    // Create polyline instance
    const newPolyline = new maps.Polyline({
      strokeColor: '#3b82f6', // blue-500
      strokeOpacity: 0.8,
      strokeWeight: 5,
    });
    setPolyline(newPolyline);

    return () => {
      newPolyline.setMap(null);
    };
  }, [map, maps, geometry]);

  useEffect(() => {
    if (!polyline || !geometry) return;
    
    let pathArray = [];
    if (encodedPolyline) {
      pathArray = geometry.encoding.decodePath(encodedPolyline);
    } else if (path && path.length > 0) {
      pathArray = path.map(p => new window.google.maps.LatLng(p.lat, p.lng));
    }

    polyline.setPath(pathArray);
    polyline.setMap(map);

  }, [polyline, encodedPolyline, path, geometry, map]);

  return null;
};

// GpsBreadcrumbs renders raw GPS pings as a faint dashed path
const GpsBreadcrumbs = ({ pings }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const [polyline, setPolyline] = useState(null);

  useEffect(() => {
    if (!map || !maps) return;

    // Create polyline instance for breadcrumbs
    const newPolyline = new maps.Polyline({
      strokeColor: '#94a3b8', // slate-400
      strokeOpacity: 0.5,
      strokeWeight: 3,
      icons: [{
        icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 2
        },
        offset: '0',
        repeat: '10px'
      }],
    });
    setPolyline(newPolyline);

    return () => {
      newPolyline.setMap(null);
    };
  }, [map, maps]);

  useEffect(() => {
    if (!polyline || !pings) return;
    
    const pathArray = pings.map(p => new window.google.maps.LatLng(p.latitude, p.longitude));
    polyline.setPath(pathArray);
    polyline.setMap(map);

  }, [polyline, pings, map]);

  return null;
};

// MismatchLines renders thin red lines between form location and actual GPS location
const MismatchLines = ({ checkpoints }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const [polylines, setPolylines] = useState([]);

  useEffect(() => {
    if (!map || !maps || !checkpoints) return;
    
    // Clear existing
    polylines.forEach(pl => pl.setMap(null));
    
    const newPolylines = [];
    checkpoints.forEach(cp => {
      if (cp.locationMatchStatus === 'LOCATION MISMATCH' && cp.employeeGpsLatitude && cp.employeeGpsLongitude) {
        const line = new maps.Polyline({
          path: [
            { lat: cp.latitude || cp.lat, lng: cp.longitude || cp.lng },
            { lat: cp.employeeGpsLatitude, lng: cp.employeeGpsLongitude }
          ],
          strokeColor: '#ef4444', // red-500
          strokeOpacity: 0.8,
          strokeWeight: 2,
          geodesic: true,
        });
        line.setMap(map);
        newPolylines.push(line);
      }
    });
    
    setPolylines(newPolylines);

    return () => {
      newPolylines.forEach(pl => pl.setMap(null));
    };
  }, [map, maps, checkpoints]); // intentionally omitting polylines from dependency to avoid infinite loop

  return null;
};

export default function LiveTrackingMap({ historicalRoute, liveLocation, lastKnownAddress }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [selectedItem, setSelectedItem] = useState(null);

  if (!apiKey) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-xl">Google Maps API key is missing.</div>;
  }

  // Initial center fallback
  let initialCenter = { lat: 21.1458, lng: 79.0882 }; // Nagpur default
  
  return (
    <APIProvider apiKey={apiKey} libraries={['geometry']}>
      <div className="w-full h-full rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner min-h-[400px]">
        <Map
          defaultCenter={initialCenter}
          defaultZoom={10}
          mapId="LIVE_TRACKING_MAP"
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          <MapController historicalRoute={historicalRoute} liveLocation={liveLocation} lastKnownAddress={lastKnownAddress} />
          
          {historicalRoute && (
            <RoutePolyline encodedPolyline={historicalRoute.encodedPolyline} path={historicalRoute.path} />
          )}

          {/* Render Breadcrumb Polyline */}
          {historicalRoute && historicalRoute.gpsPings && (
            <GpsBreadcrumbs pings={historicalRoute.gpsPings} />
          )}

          {/* Render Mismatch Lines */}
          {historicalRoute && historicalRoute.checkpoints && (
            <MismatchLines checkpoints={historicalRoute.checkpoints} />
          )}

          {/* Render Breadcrumb Markers */}
          {historicalRoute && historicalRoute.gpsPings && historicalRoute.gpsPings.map((ping, index) => (
            <AdvancedMarker 
              key={`ping-${index}`} 
              position={{ lat: ping.latitude, lng: ping.longitude }} 
              onClick={() => setSelectedItem({ type: 'GPS Ping', ...ping })}
              title={new Date(ping.timestamp).toLocaleTimeString()}
            >
              <div className="w-2 h-2 rounded-full bg-slate-500 border border-white shadow-sm opacity-60 hover:opacity-100 hover:scale-150 transition-all cursor-pointer"></div>
            </AdvancedMarker>
          ))}

          {/* Render Route Checkpoints */}
          {historicalRoute && historicalRoute.checkpoints && historicalRoute.checkpoints.map((cp, index) => {
            const lat = cp.latitude || cp.lat;
            const lng = cp.longitude || cp.lng;
            if (!lat || !lng) return null;
            
            let pinColor = '#94a3b8'; // slate
            let pinGlyphColor = '#fff';
            let glyph = '';
            
            if (cp.type === 'Origin') {
              pinColor = '#22c55e'; // green-500
              glyph = 'O';
            } else if (cp.type === 'Destination') {
              pinColor = '#ef4444'; // red-500
              glyph = 'D';
            } else if (cp.type === 'FieldVisit') {
              pinColor = '#a855f7'; // purple-500
              glyph = 'V';
            } else if (cp.type === 'OrderBooking') {
              pinColor = '#f59e0b'; // amber-500
              glyph = 'B';
            }

            return (
              <React.Fragment key={`cp-${index}`}>
                <AdvancedMarker 
                  position={{ lat, lng }} 
                  title={cp.name || cp.village || cp.type}
                  onClick={() => setSelectedItem({ ...cp, lat, lng })}
                >
                  <Pin background={pinColor} borderColor={pinColor} glyphColor={pinGlyphColor}>
                      <div className="font-bold text-xs">{glyph}</div>
                  </Pin>
                </AdvancedMarker>
                
                {cp.locationMatchStatus === 'LOCATION MISMATCH' && cp.employeeGpsLatitude && cp.employeeGpsLongitude && (
                  <AdvancedMarker 
                    position={{ lat: cp.employeeGpsLatitude, lng: cp.employeeGpsLongitude }} 
                    title="Actual GPS Location"
                    onClick={() => setSelectedItem({ ...cp, lat, lng })}
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </AdvancedMarker>
                )}
              </React.Fragment>
            );
          })}

          {/* Render Live Location if active and not already part of checkpoints */}
          {liveLocation && (
            <AdvancedMarker position={{ lat: liveLocation.latitude, lng: liveLocation.longitude }} title="Current Location">
              <div className="relative flex items-center justify-center">
                <div className="animate-ping absolute h-8 w-8 rounded-full bg-blue-500 opacity-75"></div>
                <div className="relative h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
              </div>
            </AdvancedMarker>
          )}

          {/* InfoWindow for selected item */}
          {selectedItem && (
            <InfoWindow
              position={{ lat: selectedItem.lat || selectedItem.latitude, lng: selectedItem.lng || selectedItem.longitude }}
              onCloseClick={() => setSelectedItem(null)}
            >
              <div className="p-1 max-w-xs text-sm text-slate-800 font-sans">
                <p className="font-bold text-base mb-2 border-b pb-1 text-slate-700 flex justify-between items-center gap-4">
                  {selectedItem.type || 'Location'}
                  {selectedItem.locationMatchStatus === 'LOCATION MISMATCH' && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold uppercase">
                      ⚠ Mismatch
                    </span>
                  )}
                  {selectedItem.locationMatchStatus === 'MATCHED' && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold uppercase">
                      ✓ Matched
                    </span>
                  )}
                </p>
                {selectedItem.name && <p className="mb-1"><span className="font-semibold text-slate-600">Customer:</span> {selectedItem.name}</p>}
                
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <p className="font-bold text-slate-700 mb-1">Form Location</p>
                    {selectedItem.village && <p className="mb-0.5"><span className="font-medium text-slate-500">Address:</span> {selectedItem.village}</p>}
                    <p className="text-slate-500 font-mono text-[10px] mb-1">
                      {(selectedItem.lat || selectedItem.latitude).toFixed(5)}, {(selectedItem.lng || selectedItem.longitude).toFixed(5)}
                    </p>
                    {selectedItem.timestamp && (
                      <p className="mb-0.5"><span className="font-medium text-slate-500">Submitted:</span> {new Date(selectedItem.timestamp).toLocaleString()}</p>
                    )}
                </div>

                {(selectedItem.employeeGpsLatitude || selectedItem.employeeGpsLongitude) && (
                  <div className={`mt-2 bg-slate-50 border rounded-lg p-2 text-xs ${selectedItem.locationMatchStatus === 'LOCATION MISMATCH' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                      <p className="font-bold text-slate-700 mb-1 text-blue-700">Actual GPS Location</p>
                      <p className="text-slate-500 font-mono text-[10px] mb-1">
                        {selectedItem.employeeGpsLatitude?.toFixed(5)}, {selectedItem.employeeGpsLongitude?.toFixed(5)}
                      </p>
                      {selectedItem.employeeGpsTimestamp && (
                        <p className="mb-0.5"><span className="font-medium text-slate-500">GPS Time:</span> {new Date(selectedItem.employeeGpsTimestamp).toLocaleString()}</p>
                      )}
                      {selectedItem.locationDifferenceKm !== undefined && (
                        <p className={`mt-1 font-bold ${selectedItem.locationMatchStatus === 'LOCATION MISMATCH' ? 'text-red-600' : 'text-emerald-600'}`}>
                          Difference: {selectedItem.locationDifferenceKm < 0.1 ? (selectedItem.locationDifferenceKm * 1000).toFixed(0) + ' m' : selectedItem.locationDifferenceKm.toFixed(2) + ' km'}
                        </p>
                      )}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}

        </Map>
      </div>
    </APIProvider>
  );
}
