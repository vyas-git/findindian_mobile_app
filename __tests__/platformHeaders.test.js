import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Platform } from 'react-native';
import { AuthContext } from '../src/context/AuthProvider';
import { useApi } from '../src/hooks/useApi';
import { apiRequestWithSession } from '../src/lib/api';

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('../src/context/AuthProvider', () => ({ AuthContext: require('react').createContext(null) }));
jest.mock('../src/lib/appConfig', () => ({ getAppConfig: () => ({ apiUrl: 'https://example.test' }) }));
jest.mock('../src/lib/session', () => ({ getValidSession: jest.fn(async () => ({ access_token: 'test-token' })) }));
jest.mock('../src/lib/supabase', () => ({ supabase: { auth: { refreshSession: jest.fn() } } }));

Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: jest.fn() });

describe('platform headers on API calls', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    global.fetch.mockReset().mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it.each(['android', 'ios'])('sends the %s label from the shared session client', async (platform) => {
    Platform.OS = platform;
    await apiRequestWithSession('/api/auth/me');
    expect(global.fetch).toHaveBeenCalledWith('https://example.test/api/auth/me', expect.objectContaining({
      headers: expect.objectContaining({ 'X-App-Platform': platform, Authorization: 'Bearer test-token' }),
    }));
  });

  it.each(['android', 'ios'])('sends the %s label from the screen API hook', async (platform) => {
    Platform.OS = platform;
    let request;
    function CaptureRequest() {
      request = useApi().apiRequest;
      return null;
    }
    let screen;
    act(() => {
      screen = TestRenderer.create(
        <AuthContext.Provider value={{ signOut: jest.fn() }}><CaptureRequest /></AuthContext.Provider>
      );
    });
    await request('/api/dms/member/messages');
    expect(global.fetch).toHaveBeenCalledWith('https://example.test/api/dms/member/messages', expect.objectContaining({
      headers: expect.objectContaining({ 'X-App-Platform': platform }),
    }));
    act(() => screen.unmount());
  });

  it('does not label web requests as a mobile platform', async () => {
    Platform.OS = 'web';
    await apiRequestWithSession('/api/auth/me');
    expect(global.fetch.mock.calls[0][1].headers).not.toHaveProperty('X-App-Platform');
  });
});
