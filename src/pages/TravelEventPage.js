import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthProvider';
import FlyersTripCard from '../components/FlyersTripCard';
import FlyersCelebrateSheet from '../components/FlyersCelebrateSheet';
import TravelShareCard from '../components/TravelShareCard';
import { formatTravelDate } from '../utils/travelUtils';

export default function TravelEventPage({ route, navigation }) {
  const { slug, celebrate: celebrateParam } = route.params || {};
  const { apiRequest } = useApi();
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const downloadRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [celebrate, setCelebrate] = useState(Boolean(celebrateParam));
  const [deleting, setDeleting] = useState(false);

  const pageUrl = `https://findindian.de/flyers/${slug}`;
  const creator = event?.user || {};
  const isOwner = Boolean(user?.id && creator.id && user.id === creator.id);
  const showJoin = Boolean(creator.id && !isOwner);

  const loadEvent = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/travel/${slug}`);
      setEvent(data);
    } catch (e) {
      setError(e.message || 'Trip not found');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, slug]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleJoin = () => {
    if (!creator.id) return;
    navigation.navigate('Main', {
      screen: 'Channel',
      params: {
        dmUserId: creator.id,
        dmUserName: creator.name,
        returnTo: 'TravelList',
      },
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${creator.name || 'Someone'} is flying ${event.from_airport} → ${event.to_airport} on ${formatTravelDate(event.travel_date)}.\nJoin on findIndian.de: ${pageUrl}`,
        url: pageUrl,
      });
    } catch {
      /* canceled */
    }
  };

  const handleDownload = () => {
    downloadRef.current?.download();
  };

  const handleDelete = () => {
    if (!isOwner || !slug) return;
    Alert.alert('Delete this flyer?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await apiRequest(`/api/travel/${slug}`, { method: 'DELETE' });
            navigation.navigate('Main', { screen: 'TravelList' });
          } catch (e) {
            Alert.alert('Could not delete', e.message || 'Please try again.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const onCelebrateClose = useCallback(() => setCelebrate(false), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading trip…</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.error}>{error || 'Trip not found'}</Text>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <FlyersTripCard
          event={event}
          showJoin={showJoin}
          isOwner={isOwner}
          onJoin={handleJoin}
          onShare={handleShare}
          onDownload={handleDownload}
          onDelete={handleDelete}
          deleting={deleting}
          pageUrl={pageUrl}
        />

        <TravelShareCard ref={downloadRef} event={event} pageUrl={pageUrl} />
      </ScrollView>

      <FlyersCelebrateSheet
        open={celebrate}
        onClose={onCelebrateClose}
        travelerName={creator.name}
      />
    </>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.shellBg,
      padding: 24,
    },
    loadingText: { color: colors.textSecondary, fontSize: 14 },
    container: { flex: 1, backgroundColor: colors.shellBg },
    content: { padding: 12, paddingBottom: 32 },
    error: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, marginTop: 8 },
  });
}
