import React, { useEffect, useState, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Marker, 
  Pin, 
  useMap, 
  useMapsLibrary, 
  InfoWindow,
  useApiIsLoaded
} from '@vis.gl/react-google-maps';

// Error boundary to catch any internal Google Maps runtime exceptions
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("MapErrorBoundary caught:", error?.message);
  }

  render() {
    if (this.state.hasError) {
      const lat = this.props.liveLocation?.latitude || this.props.lastKnownAddress?.latitude || 16.0682;
      const lng = this.props.liveLocation?.longitude || this.props.lastKnownAddress?.longitude || 74.3315;
      const addr = this.props.lastKnownAddress?.address || "Nesari, Maharashtra, India";

      return (
        <div className="w-full h-full min-h-[420px] rounded-2xl bg-slate-900 text-white p-6 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
            🗺️
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-black text-white">Google Maps Connection</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {this.state.error?.message || "Google Maps reported an issue loading the map."}
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-xs text-left max-w-sm w-full space-y-1.5 shadow-md">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">📍 Live Field Coordinates</span>
            <span className="font-bold text-white block">{addr}</span>
            <span className="text-slate-400 font-mono text-[11px] block">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              🔄 Reload Map
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>🗺️ View on Google Maps ↗</span>
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Calculate bearing/heading angle in degrees between two coordinates
function getHeading(p1, p2) {
  if (!p1 || !p2) return 0;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

// MapController manages fitBounds dynamically
const MapController = ({ historicalRoute, liveLocation, lastKnownAddress, employeeId }) => {
  const map = useMap();
  const [hasFittedRoute, setHasFittedRoute] = useState(false);

  useEffect(() => {
    setHasFittedRoute(false);
  }, [historicalRoute, employeeId, liveLocation?.latitude, liveLocation?.longitude]);

  useEffect(() => {
    if (!map || hasFittedRoute) return;

    const hasUsableRoute = (historicalRoute?.origin && historicalRoute?.destination) || 
      (historicalRoute?.checkpoints && historicalRoute.checkpoints.length > 0) ||
      (historicalRoute?.gpsPings && historicalRoute.gpsPings.length > 0);

    if (hasUsableRoute) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        
        if (historicalRoute.origin) {
          bounds.extend(new window.google.maps.LatLng(
            historicalRoute.origin.latitude || historicalRoute.origin.lat, 
            historicalRoute.origin.longitude || historicalRoute.origin.lng
          ));
        }
        if (historicalRoute.destination) {
          bounds.extend(new window.google.maps.LatLng(
            historicalRoute.destination.latitude || historicalRoute.destination.lat, 
            historicalRoute.destination.longitude || historicalRoute.destination.lng
          ));
        }

        if (historicalRoute.checkpoints && historicalRoute.checkpoints.length > 0) {
          historicalRoute.checkpoints.forEach(cp => {
            const lat = cp.latitude || cp.lat;
            const lng = cp.longitude || cp.lng;
            if (lat && lng) {
              bounds.extend(new window.google.maps.LatLng(lat, lng));
            }
          });
        }

        if (historicalRoute.path && historicalRoute.path.length > 0) {
          historicalRoute.path.forEach(pt => {
            const lat = pt.latitude || pt.lat;
            const lng = pt.longitude || pt.lng;
            if (lat && lng) {
              bounds.extend(new window.google.maps.LatLng(lat, lng));
            }
          });
        }

        if (historicalRoute.gpsPings && historicalRoute.gpsPings.length > 0) {
          historicalRoute.gpsPings.forEach(ping => {
            const lat = ping.latitude || ping.lat;
            const lng = ping.longitude || ping.lng;
            if (lat && lng) {
              bounds.extend(new window.google.maps.LatLng(lat, lng));
            }
          });
        }

        map.fitBounds(bounds, { top: 60, bottom: 80, left: 60, right: 60 });
        setHasFittedRoute(true);
      } catch (e) {}
    } else if (!hasUsableRoute && liveLocation) {
      try {
        map.setCenter({ lat: liveLocation.latitude, lng: liveLocation.longitude });
        map.setZoom(15);
        setHasFittedRoute(true);
      } catch (e) {}
    } else if (!hasUsableRoute && !liveLocation && lastKnownAddress) {
      if (lastKnownAddress.latitude && lastKnownAddress.longitude) {
        try {
          map.setCenter({ lat: lastKnownAddress.latitude, lng: lastKnownAddress.longitude });
          map.setZoom(15);
          setHasFittedRoute(true);
        } catch (e) {}
      }
    }
  }, [map, historicalRoute, liveLocation, lastKnownAddress, hasFittedRoute, employeeId]);

  return null;
};

// Pure JS Google Polyline Algorithm decoder (standalone, no dependencies)
function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') return [];
  const poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  try {
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
  } catch (e) {
    console.warn("Failed to decode polyline:", e);
  }
  return poly;
}

// Normalize coordinate from any object shape ({ lat, lng } or { latitude, longitude })
function extractCoord(item) {
  if (!item) return null;
  const lat = item.latitude ?? item.lat;
  const lng = item.longitude ?? item.lng;
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }
  return null;
}

// RoutePolyline renders the journey polyline connecting all waypoints/GPS pings
const RoutePolyline = ({ encodedPolyline, path, gpsPings, origin, destination, checkpoints, employeeId, onPathLoaded }) => {
  const map = useMap();
  const activeLinesRef = useRef([]);

  useEffect(() => {
    const clearLines = () => {
      activeLinesRef.current.forEach(line => {
        try {
          line.setMap(null);
        } catch (e) {}
      });
      activeLinesRef.current = [];
    };

    clearLines();

    if (!map || !window.google?.maps) return;

    let isCancelled = false;

    const startCoord = extractCoord(origin) || 
      (gpsPings && gpsPings.length > 0 ? extractCoord(gpsPings[0]) : null);
    const endCoord = extractCoord(destination) || 
      (gpsPings && gpsPings.length > 0 ? extractCoord(gpsPings[gpsPings.length - 1]) : null);

    let points = [];

    // 1. Try decoded polyline from Google Routes API if available
    if (encodedPolyline && encodedPolyline.trim()) {
      points = decodePolyline(encodedPolyline);
    }

    // 2. Try actual GPS breadcrumbs (gpsPings)
    if (points.length === 0 && gpsPings && gpsPings.length > 0) {
      points = gpsPings.map(extractCoord).filter(Boolean);
    }

    // 3. Try path prop
    if (points.length === 0 && path && path.length > 0) {
      points = path.map(extractCoord).filter(Boolean);
    }

    // 4. Fallback: connect origin -> checkpoints -> destination
    if (points.length === 0) {
      const orig = startCoord;
      const cps = (checkpoints || []).map(extractCoord).filter(Boolean);
      const dest = endCoord;
      const combo = [orig, ...cps, dest].filter(Boolean);
      if (combo.length >= 2) {
        points = combo;
      }
    }

    if (points.length < 2) {
      if (onPathLoaded) onPathLoaded([]);
      return () => {
        isCancelled = true;
        clearLines();
      };
    }

    // Anchor helper: physically links the polyline directly to start and end pin positions with ZERO gap
    const anchorPath = (pathArr) => {
      if (!pathArr || pathArr.length === 0) return pathArr;
      const result = [...pathArr];
      if (startCoord) {
        const dStart = Math.hypot(result[0].lat - startCoord.lat, result[0].lng - startCoord.lng);
        if (dStart > 0.00005) {
          result.unshift(startCoord);
        } else {
          result[0] = startCoord;
        }
      }
      if (endCoord) {
        const dEnd = Math.hypot(result[result.length - 1].lat - endCoord.lat, result[result.length - 1].lng - endCoord.lng);
        if (dEnd > 0.00005) {
          result.push(endCoord);
        } else {
          result[result.length - 1] = endCoord;
        }
      }
      return result;
    };

    const renderLines = (latLngArray) => {
      if (isCancelled) return;
      clearLines();

      // Outer glow line for maximum contrast on dark map
      const glowLine = new window.google.maps.Polyline({
        path: latLngArray,
        geodesic: true,
        strokeColor: '#60a5fa',
        strokeOpacity: 0.45,
        strokeWeight: 8,
        map: map,
      });

      // Directional arrow icon
      const arrowSymbol = {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 2.2,
        fillColor: '#ffffff',
        fillOpacity: 1,
        strokeColor: '#1d4ed8',
        strokeWeight: 1.5,
      };

      // Main route polyline
      const mainLine = new window.google.maps.Polyline({
        path: latLngArray,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        icons: [{
          icon: arrowSymbol,
          offset: '50px',
          repeat: '100px'
        }],
        map: map,
      });

      activeLinesRef.current = [glowLine, mainLine];

      if (onPathLoaded) {
        const rawCoords = latLngArray.map(pt => ({
          lat: typeof pt.lat === 'function' ? pt.lat() : pt.lat,
          lng: typeof pt.lng === 'function' ? pt.lng() : pt.lng
        }));
        onPathLoaded(rawCoords);
      }
    };

    // Render immediately using available GPS points, cleanly anchored to pins
    const anchoredInitial = anchorPath(points);
    renderLines(anchoredInitial.map(pt => new window.google.maps.LatLng(pt.lat, pt.lng)));

    // If no pre-encoded road route was provided by backend, fetch accurate road-following geometry via Google Routes API v2
    if (!encodedPolyline && points.length >= 2) {
      const startPt = startCoord || points[0];
      const endPt = endCoord || points[points.length - 1];

      const intermediateStops = (checkpoints || []).map(extractCoord).filter(Boolean);
      const intermediates = intermediateStops.slice(0, 20).map(cp => ({
        location: { latLng: { latitude: cp.lat, longitude: cp.lng } }
      }));

      const routePayload = {
        origin: { location: { latLng: { latitude: startPt.lat, longitude: startPt.lng } } },
        destination: { location: { latLng: { latitude: endPt.lat, longitude: endPt.lng } } },
        intermediates: intermediates,
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL'
      };

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC1s_R-0l5F4zhT9BmDPtDkq1dkP_gMwnw';

      fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline'
        },
        body: JSON.stringify(routePayload)
      })
      .then(res => res.json())
      .then(data => {
        if (isCancelled) return;
        if (data?.routes?.[0]?.polyline?.encodedPolyline) {
          const decodedRoadPts = decodePolyline(data.routes[0].polyline.encodedPolyline);
          if (decodedRoadPts && decodedRoadPts.length > 0) {
            const anchoredRoadPts = anchorPath(decodedRoadPts);
            renderLines(anchoredRoadPts.map(p => new window.google.maps.LatLng(p.lat, p.lng)));
          }
        }
      })
      .catch(err => {
        if (!isCancelled) console.warn('Google Routes API fetch error:', err);
      });
    }

    return () => {
      isCancelled = true;
      clearLines();
    };
  }, [map, encodedPolyline, path, gpsPings, origin, destination, checkpoints, employeeId]);

  return null;
};

// RiderTrailPolyline renders the green trail representing completed travel during replay
const RiderTrailPolyline = ({ path }) => {
  const map = useMap();
  const lineRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google?.maps || !path || path.length < 2) {
      if (lineRef.current) {
        lineRef.current.setMap(null);
        lineRef.current = null;
      }
      return;
    }

    if (!lineRef.current) {
      lineRef.current = new window.google.maps.Polyline({
        geodesic: true,
        strokeColor: '#10b981', // Vibrant emerald green for completed travel
        strokeOpacity: 0.95,
        strokeWeight: 6,
        map: map,
      });
    }

    lineRef.current.setPath(path.map(p => new window.google.maps.LatLng(p.lat, p.lng)));

    return () => {
      if (lineRef.current) {
        lineRef.current.setMap(null);
        lineRef.current = null;
      }
    };
  }, [map, path]);

  return null;
};

// MismatchLines renders thin red lines between form location and actual GPS location
const MismatchLines = ({ checkpoints }) => {
  const map = useMap();
  const [polylines, setPolylines] = useState([]);

  useEffect(() => {
    if (!map || !window.google?.maps || !checkpoints) return;
    
    polylines.forEach(pl => pl.setMap(null));
    
    const newPolylines = [];
    try {
      checkpoints.forEach(cp => {
        if (cp.locationMatchStatus === 'LOCATION MISMATCH' && cp.employeeGpsLatitude && cp.employeeGpsLongitude) {
          const line = new window.google.maps.Polyline({
            path: [
              { lat: cp.latitude || cp.lat, lng: cp.longitude || cp.lng },
              { lat: cp.employeeGpsLatitude, lng: cp.employeeGpsLongitude }
            ],
            strokeColor: '#ef4444',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            geodesic: true,
          });
          line.setMap(map);
          newPolylines.push(line);
        }
      });
    } catch (e) {}
    
    setPolylines(newPolylines);

    return () => {
      newPolylines.forEach(pl => pl.setMap(null));
    };
  }, [map, checkpoints]);

  return null;
};

// SmartMarker: Uses AdvancedMarker when AdvancedMarkerElement is supported, falls back to standard Marker
const SmartMarker = ({ position, title, onClick, children, pinColor, glyph }) => {
  const markerLib = useMapsLibrary('marker');
  const hasAdvancedMarker = Boolean(markerLib?.AdvancedMarkerElement || window.google?.maps?.marker?.AdvancedMarkerElement);

  if (hasAdvancedMarker) {
    return (
      <AdvancedMarker position={position} title={title} onClick={onClick}>
        {children || (
          <Pin background={pinColor || '#3b82f6'} borderColor={pinColor || '#3b82f6'} glyphColor="#ffffff">
            {glyph ? <div className="font-bold text-xs">{glyph}</div> : null}
          </Pin>
        )}
      </AdvancedMarker>
    );
  }

  return (
    <Marker position={position} title={title} onClick={onClick} />
  );
};

// MapElements: Only rendered when Google Maps instance and API are fully loaded
const MapElements = ({ 
  historicalRoute, 
  liveLocation, 
  lastKnownAddress, 
  isOnline, 
  selectedItem, 
  setSelectedItem, 
  employeeId,
  onPathLoaded,
  routePath,
  playbackIndex,
  isPlaying
}) => {
  const map = useMap();
  const apiIsLoaded = useApiIsLoaded();

  const safeIndex = (routePath && routePath.length > 0)
    ? Math.min(playbackIndex, routePath.length - 1)
    : 0;

  const currentRiderPoint = (routePath && routePath.length > 0)
    ? routePath[safeIndex]
    : null;

  const currentHeading = (() => {
    if (!routePath || routePath.length < 2) return 0;
    if (safeIndex < routePath.length - 1) {
      return getHeading(routePath[safeIndex], routePath[safeIndex + 1]);
    }
    return getHeading(routePath[safeIndex - 1], routePath[safeIndex]);
  })();

  const completedTrail = (routePath && routePath.length > 0 && safeIndex > 0)
    ? routePath.slice(0, safeIndex + 1)
    : [];

  // Pan map gently to follow rider if rider moves off-screen during playback
  useEffect(() => {
    if (isPlaying && currentRiderPoint && map) {
      try {
        const bounds = map.getBounds();
        if (bounds && !bounds.contains(new window.google.maps.LatLng(currentRiderPoint.lat, currentRiderPoint.lng))) {
          map.panTo(currentRiderPoint);
        }
      } catch (e) {}
    }
  }, [isPlaying, playbackIndex, currentRiderPoint, map]);

  if (!apiIsLoaded || !map) {
    return null;
  }

  return (
    <>
      <MapController historicalRoute={historicalRoute} liveLocation={liveLocation} lastKnownAddress={lastKnownAddress} employeeId={employeeId} />
      
      {historicalRoute && (
        <RoutePolyline 
          key={`route-poly-${employeeId || historicalRoute.employeeId}`}
          encodedPolyline={historicalRoute.encodedPolyline} 
          path={historicalRoute.path} 
          gpsPings={historicalRoute.gpsPings}
          origin={historicalRoute.origin}
          destination={historicalRoute.destination}
          checkpoints={historicalRoute.checkpoints}
          employeeId={employeeId || historicalRoute.employeeId}
          onPathLoaded={onPathLoaded}
        />
      )}

      {/* Traveled Emerald Green Trail */}
      {completedTrail.length >= 2 && (
        <RiderTrailPolyline path={completedTrail} />
      )}

      {historicalRoute && historicalRoute.checkpoints && (
        <MismatchLines checkpoints={historicalRoute.checkpoints} />
      )}

      {/* Start (Origin) Marker */}
      {historicalRoute?.origin && (
        <SmartMarker 
          position={{ 
            lat: historicalRoute.origin.latitude || historicalRoute.origin.lat, 
            lng: historicalRoute.origin.longitude || historicalRoute.origin.lng 
          }} 
          title="Trip Start"
          onClick={() => setSelectedItem({
            type: 'Trip Start',
            name: historicalRoute.origin.name || 'Trip Started Here',
            lat: historicalRoute.origin.latitude || historicalRoute.origin.lat,
            lng: historicalRoute.origin.longitude || historicalRoute.origin.lng,
            timestamp: historicalRoute.origin.timestamp
          })}
          pinColor="#22c55e"
          glyph="S"
        >
          <Pin background="#22c55e" borderColor="#16a34a" glyphColor="#ffffff">
            <div className="font-bold text-xs">S</div>
          </Pin>
        </SmartMarker>
      )}

      {/* Destination / Last Known Location Marker */}
      {historicalRoute?.destination && (
        <SmartMarker 
          position={{ 
            lat: historicalRoute.destination.latitude || historicalRoute.destination.lat, 
            lng: historicalRoute.destination.longitude || historicalRoute.destination.lng 
          }} 
          title="Trip End"
          onClick={() => setSelectedItem({
            type: 'Trip End',
            name: historicalRoute.destination.name || 'Last Known Location',
            lat: historicalRoute.destination.latitude || historicalRoute.destination.lat,
            lng: historicalRoute.destination.longitude || historicalRoute.destination.lng,
            timestamp: historicalRoute.destination.timestamp
          })}
          pinColor="#ef4444"
          glyph="E"
        >
          <Pin background="#ef4444" borderColor="#dc2626" glyphColor="#ffffff">
            <div className="font-bold text-xs">E</div>
          </Pin>
        </SmartMarker>
      )}

      {/* Route Checkpoints (Field Visits & Order Bookings) */}
      {historicalRoute && historicalRoute.checkpoints && historicalRoute.checkpoints.map((cp, index) => {
        const lat = cp.latitude || cp.lat;
        const lng = cp.longitude || cp.lng;
        if (!lat || !lng) return null;
        
        let pinColor = '#94a3b8';
        let pinGlyphColor = '#fff';
        let glyph = '';
        
        if (cp.type === 'Origin') {
          pinColor = '#22c55e';
          glyph = 'S';
        } else if (cp.type === 'Destination') {
          pinColor = '#ef4444';
          glyph = 'E';
        } else if (cp.type === 'FieldVisit') {
          pinColor = '#a855f7';
          glyph = 'V';
        } else if (cp.type === 'OrderBooking') {
          pinColor = '#f59e0b';
          glyph = 'B';
        }

        return (
          <React.Fragment key={`cp-${index}`}>
            <SmartMarker 
              position={{ lat, lng }} 
              title={cp.name || cp.village || cp.type}
              onClick={() => setSelectedItem({ ...cp, lat, lng })}
              pinColor={pinColor}
              glyph={glyph}
            >
              <Pin background={pinColor} borderColor={pinColor} glyphColor={pinGlyphColor}>
                <div className="font-bold text-xs">{glyph}</div>
              </Pin>
            </SmartMarker>
            
            {cp.locationMatchStatus === 'LOCATION MISMATCH' && cp.employeeGpsLatitude && cp.employeeGpsLongitude && (
              <SmartMarker 
                position={{ lat: cp.employeeGpsLatitude, lng: cp.employeeGpsLongitude }} 
                title="Actual GPS Location"
                onClick={() => setSelectedItem({ ...cp, lat, lng })}
              >
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </SmartMarker>
            )}
          </React.Fragment>
        );
      })}

      {/* Animated Rider Bike Marker */}
      {routePath && routePath.length >= 2 && currentRiderPoint && (
        <SmartMarker
          position={{ lat: currentRiderPoint.lat, lng: currentRiderPoint.lng }}
          title="Field Officer (Bike Rider)"
        >
          <div className="relative flex flex-col items-center select-none pointer-events-none -translate-x-1/2 -translate-y-1/2">
            {/* Status bubble */}
            <div className="bg-slate-900/95 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-slate-700 mb-1.5 flex items-center gap-1.5 whitespace-nowrap">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`}></span>
              <span>{isPlaying ? '🏍️ Riding...' : (safeIndex >= routePath.length - 1 ? '🏁 Arrived!' : '🏍️ Rider Ready')}</span>
            </div>

            {/* Bike icon container with heading rotation and direction pointer */}
            <div 
              className="relative flex items-center justify-center transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${currentHeading}deg)` }}
            >
              {/* Directional heading pointer arrow at top (0 deg) */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-emerald-400 drop-shadow-md z-10" />

              {/* Pulsing glow ring when active */}
              {isPlaying && (
                <div className="animate-ping absolute h-9 w-9 rounded-full bg-emerald-400 opacity-60"></div>
              )}

              {/* Rider Badge */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 border-2 border-white shadow-2xl flex items-center justify-center text-xl">
                🏍️
              </div>
            </div>
          </div>
        </SmartMarker>
      )}

      {/* Live Location Marker (when no playback or offline) */}
      {liveLocation && (!routePath || routePath.length < 2) && (
        <SmartMarker 
          position={{ lat: liveLocation.latitude, lng: liveLocation.longitude }} 
          title={(liveLocation.isOnline ?? isOnline) ? "Current Location (Online)" : "Last Known Location (Offline)"}
          onClick={() => setSelectedItem({
            type: (liveLocation.isOnline ?? isOnline) ? 'Current Location (Online)' : 'Last Known Location (Offline)',
            name: (liveLocation.isOnline ?? isOnline) ? 'Employee is Online (Live)' : 'Employee is Offline',
            lat: liveLocation.latitude,
            lng: liveLocation.longitude,
            village: lastKnownAddress?.address
          })}
        >
          <div className="relative flex items-center justify-center">
            {Boolean(liveLocation.isOnline ?? isOnline) && (
              <div className="animate-ping absolute h-8 w-8 rounded-full bg-blue-500 opacity-75"></div>
            )}
            <div className={`relative h-4 w-4 rounded-full border-2 border-white shadow-lg ${(liveLocation.isOnline ?? isOnline) ? 'bg-blue-600' : 'bg-slate-500'}`}></div>
          </div>
        </SmartMarker>
      )}

      {/* InfoWindow */}
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
    </>
  );
};

export default function LiveTrackingMap({ historicalRoute, liveLocation, lastKnownAddress, isOnline, employeeId }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC1s_R-0l5F4zhT9BmDPtDkq1dkP_gMwnw';
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Trip Playback states
  const [routePath, setRoutePath] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Clear and reset playback when switching employees
  useEffect(() => {
    setRoutePath([]);
    setPlaybackIndex(0);
    setIsPlaying(false);
  }, [employeeId, historicalRoute?.employeeId]);

  // Animation playback interval timer
  useEffect(() => {
    if (!isPlaying || !routePath || routePath.length < 2) return;

    const intervalMs = Math.max(25, Math.floor(120 / playbackSpeed));
    const timer = setInterval(() => {
      setPlaybackIndex(prev => {
        if (prev >= routePath.length - 1) {
          setIsPlaying(false);
          return routePath.length - 1;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, routePath, playbackSpeed]);

  if (!apiKey) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-xl">Google Maps API key is missing.</div>;
  }

  const initialCenter = liveLocation?.latitude && liveLocation?.longitude
    ? { lat: liveLocation.latitude, lng: liveLocation.longitude }
    : lastKnownAddress?.latitude && lastKnownAddress?.longitude
      ? { lat: lastKnownAddress.latitude, lng: lastKnownAddress.longitude }
      : { lat: 16.0682, lng: 74.3315 }; // Nesari

  return (
    <MapErrorBoundary liveLocation={liveLocation} lastKnownAddress={lastKnownAddress}>
      <APIProvider apiKey={apiKey} libraries={['geometry', 'marker', 'routes']}>
        <div className="w-full h-full rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner min-h-[440px]">
          <Map
            defaultCenter={initialCenter}
            defaultZoom={12}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={false}
            gestureHandling="greedy"
            colorScheme="DARK"
          >
            <MapElements
              historicalRoute={historicalRoute}
              liveLocation={liveLocation}
              lastKnownAddress={lastKnownAddress}
              isOnline={isOnline}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              employeeId={employeeId}
              onPathLoaded={setRoutePath}
              routePath={routePath}
              playbackIndex={playbackIndex}
              isPlaying={isPlaying}
            />
          </Map>

          {/* Floating Trip Replay / Bike Playback Controller */}
          {routePath && routePath.length >= 2 && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 z-20 flex flex-col gap-2.5 select-none transition-all">
              {/* Header: Title, Speed & Restart */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏍️</span>
                  <div>
                    <h4 className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                      <span>Rider Journey Playback</span>
                      {isPlaying && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          RIDING
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {((playbackIndex / (routePath.length - 1)) * 100).toFixed(0)}% • Waypoint {playbackIndex + 1}/{routePath.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 4].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                        playbackSpeed === spd 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setPlaybackIndex(0);
                      setIsPlaying(true);
                    }}
                    title="Restart journey from start"
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer font-bold ml-1"
                  >
                    ⏮
                  </button>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={routePath.length - 1}
                  value={playbackIndex}
                  onChange={(e) => {
                    setPlaybackIndex(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Play / Pause Toggle Button */}
              <button
                onClick={() => {
                  if (playbackIndex >= routePath.length - 1) {
                    setPlaybackIndex(0);
                    setIsPlaying(true);
                  } else {
                    setIsPlaying(!isPlaying);
                  }
                }}
                className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <span>
                  {isPlaying 
                    ? '⏸ Pause Ride' 
                    : (playbackIndex >= routePath.length - 1 
                        ? '🔄 Replay Journey from Start' 
                        : '▶ Play Rider Journey (🏍️)')
                  }
                </span>
              </button>
            </div>
          )}
        </div>
      </APIProvider>
    </MapErrorBoundary>
  );
}
