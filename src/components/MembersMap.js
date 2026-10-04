import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { getCityCoordinates, groupMembersByCity } from '../data/germanyCityCoordinates';

function buildMapHtml(isDark, accentColor) {
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const mapBg = '#e8eef2';
  const textColor = isDark ? '#111' : '#111';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${mapBg}; }
    .leaflet-custom-marker { background: transparent !important; border: none !important; }
    .leaflet-city-marker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      cursor: pointer;
      padding: 3px 4px 3px 2px;
      border-radius: 8px;
    }
    .leaflet-city-marker:hover { background: rgba(255, 255, 255, 0.92); }
    .leaflet-city-marker.selected { background: rgba(221, 0, 0, 0.12); }
    .leaflet-city-name {
      font-size: 13px;
      font-weight: 700;
      color: ${textColor};
      font-family: sans-serif;
      text-shadow: 0 0 3px rgba(255,255,255,0.9);
    }
    .leaflet-city-badge {
      font-size: 11px; font-weight: 700; color: #fff; background: ${accentColor};
      padding: 3px 7px; border-radius: 999px; line-height: 1.2;
      box-shadow: 0 1px 3px rgba(0,0,0,0.45);
    }
    .leaflet-city-marker.selected .leaflet-city-badge { background: #111; color: #fff; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let markerLayer = [];

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function createMarkerIcon(city, count, isSelected) {
      return L.divIcon({
        html:
          '<div class="leaflet-city-marker ' + (isSelected ? 'selected' : '') + '">' +
          '<span class="leaflet-city-name">' + escapeHtml(city) + '</span>' +
          '<span class="leaflet-city-badge">+' + count + '</span></div>',
        className: 'leaflet-custom-marker',
        iconSize: [null, null],
        iconAnchor: [0, 0],
      });
    }

    function initMap() {
      map = L.map('map', { zoomControl: true, attributionControl: true, zoomSnap: 0.5 }).setView([51.16, 10.45], 6);
      L.tileLayer('${tileUrl}', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      map.fitBounds([[47.27, 5.87], [55.08, 15.04]], { padding: [8, 8], maxZoom: 7 });
      map.setZoom(map.getZoom() + 0.5);
    }

    window.updateMarkers = function(markers, selectedCity) {
      if (!map) initMap();
      markerLayer.forEach(function(m) { map.removeLayer(m); });
      markerLayer = [];
      (markers || []).forEach(function(item) {
        const marker = L.marker([item.latitude, item.longitude], {
          icon: createMarkerIcon(item.city, item.count, selectedCity === item.city),
        });
        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cityPress', city: item.city }));
          }
        });
        marker.addTo(map);
        markerLayer.push(marker);
      });
    };

    initMap();
    window.updateMarkers([], null);
  </script>
</body>
</html>`;
}

export default function MembersMap({ members, selectedCity, onCityPress }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const webViewRef = useRef(null);
  const cityGroups = useMemo(() => groupMembersByCity(members), [members]);
  const mapHtml = useMemo(
    () => buildMapHtml(isDark, colors.mapAccent),
    [isDark, colors.mapAccent]
  );

  const markers = useMemo(() => {
    return Object.entries(cityGroups)
      .map(([city, cityMembers]) => {
        const coords = getCityCoordinates(city);
        if (!coords) return null;
        return {
          city,
          count: cityMembers.length,
          latitude: coords[0],
          longitude: coords[1],
        };
      })
      .filter(Boolean);
  }, [cityGroups]);

  const syncMarkers = useCallback(() => {
    const payload = JSON.stringify(markers);
    const city = JSON.stringify(selectedCity);
    webViewRef.current?.injectJavaScript(
      `window.updateMarkers(${payload}, ${city}); true;`
    );
  }, [markers, selectedCity]);

  useEffect(() => {
    syncMarkers();
  }, [syncMarkers]);

  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'cityPress' && data.city) {
          onCityPress?.(data.city);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onCityPress]
  );

  return (
    <View style={styles.container}>
      <WebView
        key={isDark ? 'map-dark' : 'map-light'}
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={syncMarkers}
        onMessage={handleMessage}
      />
      {selectedCity ? (
        <View style={styles.filterHint}>
          <Text style={styles.filterHintText}>Showing members in {selectedCity}</Text>
          <TouchableOpacity onPress={() => onCityPress?.(null)}>
            <Text style={styles.clearFilter}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1, backgroundColor: colors.mapBg },
    filterHint: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      right: 12,
      backgroundColor: colors.mapFilterBg,
      borderRadius: 10,
      padding: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterHintText: { fontWeight: '600', color: colors.textPrimary },
    clearFilter: { color: colors.primary, fontWeight: '600' },
  });
}
