import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthProvider';
import { NotificationContext, NotificationProvider } from '../context/NotificationContext';
import { AppShellProvider, useAppShell } from '../context/AppShellContext';
import { useTheme } from '../context/ThemeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import LoginScreen from '../screens/LoginScreen';
import MembersScreen from '../screens/MembersScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import PostsScreen from '../screens/PostsScreen';
import ChatScreen from '../screens/ChatScreen';
import JobsScreen from '../screens/JobsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostViewScreen from '../screens/PostViewScreen';
import EmailAllMembersScreen from '../screens/EmailAllMembersScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import AppHeader from '../components/AppHeader';
import SimpleScreenHeader from '../components/SimpleScreenHeader';
import AppDrawer from '../components/AppDrawer';
import ProfileModal from '../components/ProfileModal';
import ConversationsScreen from '../screens/ConversationsScreen';
import GermanyCityModal from '../components/GermanyCityModal';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationState } from '@react-navigation/native';
import { apiRequestWithSession } from '../lib/api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ROUTE_TO_PATH = {
  Members: '/members',
  Leaderboard: '/leaderboard',
  Posts: '/posts',
  Channel: '/chat',
  Jobs: '/jobs',
  Messages: '/messages',
  CreatePost: '/posts/create',
  PostView: '/posts/:id',
  EmailAllMembers: '/send-email-members',
};

const linking = {
  prefixes: ['findindianmobile://', 'exp://'],
  config: {
    screens: {
      Main: {
        screens: {
          Members: 'members',
          Leaderboard: 'leaderboard',
          Posts: 'posts',
          Channel: {
            path: 'chat',
            parse: { dmUserId: (id) => id },
          },
          Jobs: 'jobs',
        },
      },
      PostView: 'posts/:postId',
    },
  },
};

function getTabState(rootState) {
  const mainRoute = rootState?.routes?.find((r) => r.name === 'Main');
  return mainRoute?.state || null;
}

const TAB_HEADER_TITLES = {
  Leaderboard: 'Top members in community',
  Posts: 'Community Posts',
  Channel: 'Channel',
  Jobs: 'Jobs',
};

function MainTabsContent({ navigation }) {
  const { user, userProfile, refreshProfile } = useContext(AuthContext);
  const { unreadDm, unreadChannel } = useContext(NotificationContext);
  const { searchQuery, setSearchQuery, searchPlaceholder, header } = useAppShell();
  const { colors } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { activeRoute, channelDmUserId } = useNavigationState((state) => {
    const tabState = getTabState(state);
    if (!tabState) return { activeRoute: 'Members', channelDmUserId: null };
    const route = tabState.routes[tabState.index];
    return {
      activeRoute: route?.name || 'Members',
      channelDmUserId: route?.name === 'Channel' ? route?.params?.dmUserId : null,
    };
  }) || { activeRoute: 'Members', channelDmUserId: null };

  const messageBadge = unreadDm + unreadChannel;
  const hideChrome =
    header.variant === 'none' || (activeRoute === 'Channel' && Boolean(channelDmUserId));
  const simpleHeaderTitle = header.title || TAB_HEADER_TITLES[activeRoute];
  const showSimpleHeader = !hideChrome && activeRoute !== 'Members' && Boolean(simpleHeaderTitle);

  const needsCity =
    userProfile &&
    (!userProfile.germany_city || String(userProfile.germany_city).trim() === '');

  const sentViewsRef = useRef(new Set());
  useEffect(() => {
    const path = ROUTE_TO_PATH[activeRoute];
    if (!path || !user?.id) return;
    const key = `mobile:${path}`;
    if (sentViewsRef.current.has(key)) return;
    sentViewsRef.current.add(key);
    apiRequestWithSession('/api/analytics/view', {
      method: 'POST',
      body: JSON.stringify({ path, source: 'mobile' }),
    }).catch(() => {
      sentViewsRef.current.delete(key);
    });
  }, [activeRoute, user?.id]);

  const handleDrawerNavigate = useCallback(
    (routeName, params) => {
      setSearchQuery('');
      setDrawerOpen(false);
      // Tab screens are nested under Stack "Main" — navigate with screen param
      navigation.navigate('Main', {
        screen: routeName,
        params: params || {},
      });
    },
    [navigation, setSearchQuery]
  );

  const openMessages = useCallback(() => {
    navigation.navigate('Messages');
  }, [navigation]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.shellBg }]}>
      {hideChrome ? null : activeRoute === 'Members' ? (
        <AppHeader
          user={user}
          userProfile={userProfile}
          onProfilePress={() => setDrawerOpen(true)}
          onMessagesPress={openMessages}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
          messageBadge={messageBadge}
        />
      ) : showSimpleHeader ? (
        <SimpleScreenHeader
          title={simpleHeaderTitle}
          user={user}
          userProfile={userProfile}
          onProfilePress={() => setDrawerOpen(true)}
          onMessagesPress={openMessages}
          messageBadge={messageBadge}
        />
      ) : null}

      <Tab.Navigator
        initialRouteName="Members"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.textPrimary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarStyle: hideChrome
            ? { display: 'none' }
            : {
                borderTopColor: colors.divider,
                backgroundColor: colors.headerBg,
                height: 56,
                paddingBottom: 4,
              },
          tabBarIcon: ({ color, size }) => {
            const icons = {
              Members: 'people',
              Leaderboard: 'trophy',
              Posts: 'newspaper',
              Channel: 'chatbubbles',
              Jobs: 'briefcase',
            };
            return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
          },
        })}
        screenListeners={{
          tabPress: () => setSearchQuery(''),
        }}
      >
        <Tab.Screen name="Members" component={MembersScreen} options={{ title: 'Members' }} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Board' }} />
        <Tab.Screen name="Posts" component={PostsScreen} options={{ title: 'Posts' }} />
        <Tab.Screen
          name="Channel"
          component={ChatScreen}
          options={{ title: 'Channel' }}
          listeners={({ navigation: tabNav }) => ({
            tabPress: () => {
              tabNav.navigate('Channel', { dmUserId: undefined, dmUserName: undefined });
            },
          })}
        />
        <Tab.Screen
          name="Jobs"
          component={JobsScreen}
          options={{ title: 'Jobs' }}
        />
      </Tab.Navigator>

      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeRoute={activeRoute}
        onNavigate={handleDrawerNavigate}
        onEditProfile={() => {
          setDrawerOpen(false);
          setShowProfile(true);
        }}
        onEmailAll={() => {
          setDrawerOpen(false);
          navigation.navigate('EmailAllMembers');
        }}
      />

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        onUpdated={refreshProfile}
        onDeleteAccount={() => {
          setShowProfile(false);
          navigation.navigate('DeleteAccount');
        }}
      />
      <GermanyCityModal visible={Boolean(needsCity)} onSaved={() => refreshProfile()} />
    </View>
  );
}

function MainTabs(props) {
  const searchPlaceholder = useMemo(() => {
    // placeholder updated via navigation state in child - use generic default here
    return 'Search by name, city';
  }, []);

  return (
    <AppShellProvider placeholder={searchPlaceholder}>
      <MainTabsContent {...props} />
    </AppShellProvider>
  );
}

function AuthenticatedApp({ navigationRef }) {
  const { colors } = useTheme();
  const handleNotificationTap = useCallback(
    (data) => {
      if (!data) return;

      const navigate = () => {
        if (!navigationRef.current?.isReady?.()) return false;
        if (data.type === 'dm' && data.userId) {
          navigationRef.current.navigate('Main', {
            screen: 'Channel',
            params: { dmUserId: data.userId },
          });
        } else if (data.type === 'channel') {
          navigationRef.current.navigate('Main', { screen: 'Channel' });
        } else if (data.type === 'post' && data.postId) {
          navigationRef.current.navigate('PostView', { postId: data.postId });
        }
        return true;
      };

      if (navigate()) return;

      let attempts = 0;
      const retry = setInterval(() => {
        attempts += 1;
        if (navigate() || attempts >= 20) {
          clearInterval(retry);
        }
      }, 100);
    },
    [navigationRef]
  );

  usePushNotifications(handleNotificationTap);

  return (
    <NotificationProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.shellBg },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Messages"
          component={ConversationsScreen}
          options={{ title: 'Messaging', headerBackTitle: 'Back' }}
        />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Create Post' }} />
        <Stack.Screen name="PostView" component={PostViewScreen} options={{ title: 'Post' }} />
        <Stack.Screen name="EmailAllMembers" component={EmailAllMembersScreen} options={{ title: 'Email Members' }} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: 'Delete Account' }} />
      </Stack.Navigator>
    </NotificationProvider>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const navigationRef = useRef(null);
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.shellBg,
      card: colors.headerBg,
      text: colors.textPrimary,
      border: colors.divider,
    },
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.headerBg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} ref={navigationRef} theme={navTheme}>
      {user ? (
        <AuthenticatedApp navigationRef={navigationRef} />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
