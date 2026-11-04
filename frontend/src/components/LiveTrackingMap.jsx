import React, { useEffect, useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Marker,
  Pin, 
  useMap, 
  useMapsLibrary, 
  InfoWindow,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus
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

// MapController manages fitBounds dynamically
const MapController = ({ historicalRoute, liveLocation, lastKnownAddress }) => {
  const map = useMap();
  const [hasFittedRoute, setHasFittedRoute] = useState(false);

  useEffect(() => {
    if (!historicalRoute) {
      setHasFittedRoute(false);
    }
  }, [historicalRoute]);

  useEffect(() => {
    if (!map || hasFittedRoute) return;

    const hasUsableRoute = (historicalRoute?.origin && historicalRoute?.destination) || (historicalRoute?.checkpoints && historicalRoute.checkpoints.length > 0);

    if (hasUsableRoute) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        
        if (historicalRoute.origin) {
          bounds.extend(new window.google.maps.LatLng(historicalRoute.origin.latitude || historicalRoute.origin.lat, historicalRoute.origin.longitude || historicalRoute.origin.lng));
        }
        if (historicalRoute.destination) {
          bounds.extend(new window.google.maps.LatLng(historicalRoute.destination.latitude || historicalRoute.destination.lat, historicalRoute.destination.longitude || historicalRoute.destination.lng));
        }

        if (historicalRoute.checkpoints && historicalRoute.checkpoints.length > 0) {
          historicalRoute.checkpoints.forEach(cp => {
            if ((cp.latitude || cp.lat) && (cp.longitude || cp.lng)) {
              bounds.extend(new window.google.maps.LatLng(cp.latitude || cp.lat, cp.longitude || cp.lng));
            }
          });
        }

        if (historicalRoute.path && historicalRoute.path.length > 0) {
          historicalRoute.path.forEach(pt => {
            bounds.extend(new window.google.maps.LatLng(pt.lat, pt.lng));
          });
        }

        if (historicalRoute.gpsPings && historicalRoute.gpsPings.length > 0) {
          historicalRoute.gpsPings.forEach(ping => {
            bounds.extend(new window.google.maps.LatLng(ping.latitude, ping.longitude));
          });
        }

        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        setHasFittedRoute(true);
      } catch (e) {}
    } else if (!hasUsableRoute && liveLocation) {
      try {
        map.setCenter({ lat: liveLocation.latitude, lng: liveLocation.longitude });
        map.setZoom(16);
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

    const newPolyline = new maps.Polyline({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 5,
    });
    setPolyline(newPolyline);

    return () => {
      newPolyline.setMap(null);
    };
  }, [map, maps, geometry]);

  useEffect(() => {
    if (!polyline || !geometry || !map) return;
    
    let pathArray = [];
    try {
      if (encodedPolyline) {
        pathArray = geometry.encoding.decodePath(encodedPolyline);
      } else if (path && path.length > 0) {
        pathArray = path.map(p => new window.google.maps.LatLng(p.lat, p.lng));
      }
      polyline.setPath(pathArray);
      polyline.setMap(map);
    } catch (e) {}
  }, [polyline, encodedPolyline, path, geometry, map]);

  return null;
};

// MismatchLines renders thin red lines between form location and actual GPS location
const MismatchLines = ({ checkpoints }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const [polylines, setPolylines] = useState([]);

  useEffect(() => {
    if (!map || !maps || !checkpoints) return;
    
    polylines.forEach(pl => pl.setMap(null));
    
    const newPolylines = [];
    try {
      checkpoints.forEach(cp => {
        if (cp.locationMatchStatus === 'LOCATION MISMATCH' && cp.employeeGpsLatitude && cp.employeeGpsLongitude) {
          const line = new maps.Polyline({
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
  }, [map, maps, checkpoints]);

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
const MapElements = ({ historicalRoute, liveLocation, lastKnownAddress, isOnline, selectedItem, setSelectedItem }) => {
  const map = useMap();
  const apiIsLoaded = useApiIsLoaded();

  if (!apiIsLoaded || !map) {
    return null;
  }

  return (
    <>
      <MapController historicalRoute={historicalRoute} liveLocation={liveLocation} lastKnownAddress={lastKnownAddress} />
      
      {historicalRoute && (
        <RoutePolyline encodedPolyline={historicalRoute.encodedPolyline} path={historicalRoute.path} />
      )}

      {historicalRoute && historicalRoute.checkpoints && (
        <MismatchLines checkpoints={historicalRoute.checkpoints} />
      )}

      {/* Route Checkpoints */}
      {historicalRoute && historicalRoute.checkpoints && historicalRoute.checkpoints.map((cp, index) => {
        const lat = cp.latitude || cp.lat;
        const lng = cp.longitude || cp.lng;
        if (!lat || !lng) return null;
        
        let pinColor = '#94a3b8';
        let pinGlyphColor = '#fff';
        let glyph = '';
        
        if (cp.type === 'Origin') {
          pinColor = '#22c55e';
          glyph = 'O';
        } else if (cp.type === 'Destination') {
          pinColor = '#ef4444';
          glyph = 'D';
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

      {/* Live Location Marker */}
      {liveLocation && (
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

export default function LiveTrackingMap({ historicalRoute, liveLocation, lastKnownAddress, isOnline }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC1s_R-0l5F4zhT9BmDPtDkq1dkP_gMwnw';
  const [selectedItem, setSelectedItem] = useState(null);

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
      <APIProvider apiKey={apiKey} libraries={['geometry', 'marker']}>
        <div className="w-full h-full rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner min-h-[400px]">
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
            />
          </Map>
        </div>
      </APIProvider>
    </MapErrorBoundary>
  );
}
