import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthProvider';
import FlyersTripCard from '../components/FlyersTripCard';
import FlyerComments from '../components/FlyerComments';
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
  const isCurrentFlyer = Boolean(slug && event?.slug === slug);
  const isOwner = Boolean(isCurrentFlyer && user?.id && user.id === creator.id);
  const showJoin = Boolean(creator.id && !isOwner);

  useEffect(() => {
    if (!slug) {
      setEvent(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setEvent(null);
    setError(null);
    apiRequest(`/api/travel/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setEvent(data); })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message || 'Trip not found'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiRequest, slug]);

  const openDM = (id, name) => {
    if (!id || id === user?.id) return;
    navigation.navigate('Main', {
      screen: 'Channel',
      params: {
        dmUserId: id,
        dmUserName: name,
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
    if (isOwner) downloadRef.current?.download();
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

  if (loading || (event && !isCurrentFlyer)) {
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FlyersTripCard
          event={event}
          showJoin={showJoin}
          isOwner={isOwner}
          onJoin={() => openDM(creator.id, creator.name)}
          onShare={handleShare}
          onDownload={isOwner ? handleDownload : undefined}
          onDelete={handleDelete}
          deleting={deleting}
          pageUrl={pageUrl}
        />

        <FlyerComments key={`${event.slug}:${user?.id}`} slug={event.slug} userId={user?.id} onMessage={openDM} />
        {isOwner && <TravelShareCard ref={downloadRef} event={event} pageUrl={pageUrl} />}
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
