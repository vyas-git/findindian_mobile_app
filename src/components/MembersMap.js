import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { getCityCoordinates, groupMembersByCity } from '../data/germanyCityCoordinates';

function buildMapHtml(isDark, accentColor) {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const textColor = isDark ? '#f5f5f5' : '#111b21';
  const mapBg = isDark ? '#1a1a1a' : '#f5f6f6';
  const selectedBg = isDark ? 'rgba(129, 140, 248, 0.28)' : 'rgba(102, 126, 234, 0.2)';
  const selectedShadow = isDark ? 'rgba(129, 140, 248, 0.45)' : 'rgba(102, 126, 234, 0.4)';

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
      align-items: flex-start;
      gap: 6px;
      white-space: nowrap;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 6px;
    }
    .leaflet-city-marker.selected {
      background: ${selectedBg};
      box-shadow: 0 2px 8px ${selectedShadow};
    }
    .leaflet-city-name { font-size: 15px; font-weight: 600; color: ${textColor}; font-family: sans-serif; }
    .leaflet-city-badge {
      font-size: 10px; font-weight: 700; color: #fff; background: ${accentColor};
      padding: 2px 6px; border-radius: 10px;
    }
    .leaflet-city-marker.selected .leaflet-city-badge { background: #DD0000; }
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
      map = L.map('map', { zoomControl: true, attributionControl: true }).setView([51.0, 10.5], 6);
      L.tileLayer('${tileUrl}', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
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
