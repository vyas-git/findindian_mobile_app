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
import PostsScreen from '../screens/PostsScreen';
import ChatScreen from '../screens/ChatScreen';
import JobsScreen from '../screens/JobsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostViewScreen from '../screens/PostViewScreen';
import EmailAllMembersScreen from '../screens/EmailAllMembersScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import AppHeader from '../components/AppHeader';
import AppDrawer from '../components/AppDrawer';
import ProfileModal from '../components/ProfileModal';
import ConversationsScreen from '../screens/ConversationsScreen';
import GermanyCityModal from '../components/GermanyCityModal';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationState } from '@react-navigation/native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: ['findindianmobile://', 'exp://'],
  config: {
    screens: {
      Main: {
        screens: {
          Members: 'members',
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

function MainTabsContent({ navigation }) {
  const { user, userProfile, refreshProfile } = useContext(AuthContext);
  const { unreadDm, unreadChannel } = useContext(NotificationContext);
  const { searchQuery, setSearchQuery, searchPlaceholder } = useAppShell();
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
  const hideMainHeader = activeRoute === 'Channel' && Boolean(channelDmUserId);

  const needsCity =
    userProfile &&
    (!userProfile.germany_city || String(userProfile.germany_city).trim() === '');

  const handleDrawerNavigate = useCallback(
    (routeName, params) => {
      setSearchQuery('');
      navigation.navigate(routeName, params);
    },
    [navigation, setSearchQuery]
  );

  const openMessages = useCallback(() => {
    navigation.navigate('Messages');
  }, [navigation]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.shellBg }]}>
      {!hideMainHeader ? (
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
      ) : null}

      <Tab.Navigator
        initialRouteName="Members"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.textPrimary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarStyle: hideMainHeader
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
          options={{ tabBarButton: () => null, title: 'Jobs' }}
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
        onEmailAll={() => navigation.navigate('EmailAllMembers')}
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
  const handleNotificationTap = useCallback(
    (data) => {
      if (!data || !navigationRef.current) return;
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
    },
    [navigationRef]
  );

  usePushNotifications(handleNotificationTap);

  return (
    <NotificationProvider>
      <Stack.Navigator>
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
  const navTheme = isDark ? DarkTheme : DefaultTheme;

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
