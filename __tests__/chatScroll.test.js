import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import ChatScreen from '../src/screens/ChatScreen';
import { AuthContext } from '../src/context/AuthProvider';
import { NotificationContext } from '../src/context/NotificationContext';

const mockNativeScrollToEnd = jest.fn();
const mockScrollToIndex = jest.fn();
const mockSetHeader = jest.fn();
const mockSetActiveChat = jest.fn();
const mockMarkChatRead = jest.fn();
const mockApiRequest = jest.fn();
const mockKeyboardListeners = {};
let mockIsFocused = true;

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    ActivityIndicator: 'ActivityIndicator',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Image: 'Image',
    StyleSheet: { create: (styles) => styles },
    Keyboard: { addListener: (event, callback) => {
      mockKeyboardListeners[event] = callback;
      return { remove: () => { delete mockKeyboardListeners[event]; } };
    } },
    Platform: { OS: 'android' },
    Alert: { alert: jest.fn() },
    FlatList: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getScrollResponder: () => ({ scrollToEnd: mockNativeScrollToEnd }),
        scrollToIndex: mockScrollToIndex,
      }));
      return React.createElement('FlatList', props);
    }),
  };
});

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockIsFocused,
  useFocusEffect: (callback) => require('react').useEffect(callback, [callback]),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('../src/hooks/useApi', () => ({
  useApi: () => ({ apiRequest: mockApiRequest }),
}));
jest.mock('../src/context/AuthProvider', () => ({
  AuthContext: require('react').createContext(null),
}));
jest.mock('../src/context/NotificationContext', () => ({
  NotificationContext: require('react').createContext(null),
}));
jest.mock('../src/context/AppShellContext', () => ({
  useAppShell: () => ({ setHeader: mockSetHeader }),
}));
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ colors: {} }),
}));

const navigation = { setParams: jest.fn(), navigate: jest.fn() };

// The screen's API is mocked; avoid loading Expo's native fetch at Jest teardown.
Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: jest.fn() });

function channelElement(params = {}) {
  return (
    <AuthContext.Provider value={{ user: { id: 'me' } }}>
      <NotificationContext.Provider value={{ markChatRead: mockMarkChatRead, setActiveChat: mockSetActiveChat }}>
        <ChatScreen route={{ params }} navigation={navigation} />
      </NotificationContext.Provider>
    </AuthContext.Provider>
  );
}

function renderChannel() {
  return TestRenderer.create(channelElement());
}

describe('channel scrolling', () => {
  let screen;
  let channelMessages;

  beforeEach(() => {
    jest.useFakeTimers();
    mockIsFocused = true;
    global.IS_REACT_ACT_ENVIRONMENT = true;
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    mockNativeScrollToEnd.mockClear();
    mockScrollToIndex.mockClear();
    mockApiRequest.mockReset();
    channelMessages = Array.from({ length: 50 }, (_, index) => ({
      id: String(index),
      user_id: 'member',
      user_name: 'Member',
      text: 'Message ' + index,
    }));
    mockApiRequest.mockImplementation(async (path) => {
      if (path === '/api/channels') {
        return { channels: [{ id: 'general', name: 'general' }] };
      }
      if (path === '/api/channels/general/messages?limit=50') {
        return { messages: channelMessages };
      }
      throw new Error('Unexpected request: ' + path);
    });
  });

  afterEach(() => {
    if (screen) act(() => screen.unmount());
    screen = null;
    jest.useRealTimers();
  });

  it('opens at the newest message even without a content-size event', async () => {
    await act(async () => {
      screen = renderChannel();
    });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    expect(screen.root.findByType('FlatList').props.data).toHaveLength(50);
    expect(mockNativeScrollToEnd).toHaveBeenCalledWith({ animated: false });
    expect(mockScrollToIndex).not.toHaveBeenCalled();
  });

  it('keeps users reading history in place while following changes near the bottom', async () => {
    await act(async () => {
      screen = renderChannel();
    });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    const list = screen.root.findByType('FlatList');
    mockNativeScrollToEnd.mockClear();

    act(() => {
      list.props.onScroll({
        nativeEvent: {
          contentSize: { height: 2000 },
          layoutMeasurement: { height: 600 },
          contentOffset: { y: 500 },
        },
      });
      list.props.onContentSizeChange();
      jest.advanceTimersByTime(20);
    });
    expect(mockNativeScrollToEnd).not.toHaveBeenCalled();

    act(() => {
      list.props.onScroll({
        nativeEvent: {
          contentSize: { height: 2000 },
          layoutMeasurement: { height: 600 },
          contentOffset: { y: 1400 },
        },
      });
      list.props.onContentSizeChange();
      jest.advanceTimersByTime(20);
    });
    expect(mockNativeScrollToEnd).toHaveBeenCalledWith({ animated: false });
  });

  it('returns to the latest message when reopening the channel tab', async () => {
    await act(async () => {
      screen = renderChannel();
    });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    mockNativeScrollToEnd.mockClear();

    act(() => {
      mockIsFocused = false;
      screen.update(channelElement());
    });
    act(() => {
      mockIsFocused = true;
      screen.update(channelElement());
      jest.advanceTimersByTime(20);
    });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    expect(mockNativeScrollToEnd).toHaveBeenCalledWith({ animated: false });
  });

  it('returns to the latest message when the Android keyboard opens for the channel', async () => {
    await act(async () => {
      screen = renderChannel();
    });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    const list = screen.root.findByType('FlatList');
    act(() => list.props.onScroll({
      nativeEvent: {
        contentSize: { height: 2000 },
        layoutMeasurement: { height: 600 },
        contentOffset: { y: 500 },
      },
    }));
    mockNativeScrollToEnd.mockClear();

    act(() => {
      screen.root.findByType('TextInput').props.onFocus();
      mockKeyboardListeners.keyboardDidShow();
      jest.advanceTimersByTime(100);
    });

    expect(mockNativeScrollToEnd).toHaveBeenCalledWith({ animated: true });
    expect(screen.root.findByType('KeyboardAvoidingView').props.behavior).toBe('height');
    expect(screen.root.findByType('KeyboardAvoidingView').props.enabled).toBe(false);
  });

  it.each([
    ['channel', {}, 'channel_message'],
    ['private', { dmUserId: 'member', dmUserName: 'Member' }, 'dm_message'],
  ])('reports a %s message with the correct content type on Android', async (_name, params, expectedType) => {
    const message = { id: 'message-1', user_id: 'member', user_name: 'Member', text: 'Hello' };
    mockApiRequest.mockImplementation(async (path) => {
      if (path === '/api/channels') return { channels: [{ id: 'general', name: 'general' }] };
      if (path === '/api/channels/general/messages?limit=50' || path === '/api/dms/member/messages?limit=50') {
        return { messages: [message] };
      }
      if (path === '/api/users/member') return { id: 'member', name: 'Member' };
      if (path === '/api/reports') return {};
      throw new Error('Unexpected request: ' + path);
    });
    Alert.alert.mockClear();

    await act(async () => {
      screen = TestRenderer.create(channelElement(params));
    });
    expect(screen.root.findByType('KeyboardAvoidingView').props.enabled).toBe(expectedType === 'dm_message');
    let bubble;
    act(() => {
      bubble = TestRenderer.create(screen.root.findByType('FlatList').props.renderItem({ item: message }));
    });
    act(() => bubble.root.findAllByType('TouchableOpacity').find((item) => item.props.onLongPress).props.onLongPress());
    const options = Alert.alert.mock.calls[0][2];
    await act(async () => {
      await options.find((option) => option.text === 'Report message').onPress();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/reports', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        reported_user_id: 'member',
        content_type: expectedType,
        content_id: 'message-1',
        reason: expectedType === 'dm_message' ? 'Objectionable message in direct messages' : 'Objectionable message in community chat',
      }),
    }));
    act(() => bubble.unmount());
  });

  it('follows new channel messages only while the user is near the bottom', async () => {
    await act(async () => {
      screen = renderChannel();
    });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    const list = screen.root.findByType('FlatList');
    mockNativeScrollToEnd.mockClear();

    act(() => list.props.onScroll({
      nativeEvent: {
        contentSize: { height: 2000 },
        layoutMeasurement: { height: 600 },
        contentOffset: { y: 1400 },
      },
    }));
    channelMessages = [...channelMessages, { id: '50', user_id: 'member', text: 'New message' }];
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(mockNativeScrollToEnd).toHaveBeenCalledWith({ animated: true });

    mockNativeScrollToEnd.mockClear();
    act(() => list.props.onScroll({
      nativeEvent: {
        contentSize: { height: 2000 },
        layoutMeasurement: { height: 600 },
        contentOffset: { y: 500 },
      },
    }));
    channelMessages = [...channelMessages, { id: '51', user_id: 'member', text: 'Another message' }];
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(mockNativeScrollToEnd).not.toHaveBeenCalled();
  });
});
