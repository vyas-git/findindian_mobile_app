import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AuthContext } from '../src/context/AuthProvider';
import TravelEventPage from '../src/pages/TravelEventPage';

const mockApiRequest = jest.fn();
const mockDownload = jest.fn();

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: { create: (styles) => styles },
}));
jest.mock('../src/context/AuthProvider', () => ({
  AuthContext: require('react').createContext(null),
}));
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ colors: {} }),
}));
jest.mock('../src/hooks/useApi', () => ({
  useApi: () => ({ apiRequest: mockApiRequest }),
}));
jest.mock('../src/components/FlyerComments', () => 'FlyerComments');
jest.mock('../src/components/FlyersCelebrateSheet', () => 'FlyersCelebrateSheet');
jest.mock('../src/components/TravelShareCard', () => {
  const React = require('react');
  return React.forwardRef((_, ref) => {
    React.useImperativeHandle(ref, () => ({ download: mockDownload }));
    return React.createElement('ShareCard');
  });
});

// The API is mocked, so Jest does not need Expo's native fetch shim.
Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: jest.fn() });

function flyerPage(slug) {
  return (
    <AuthContext.Provider value={{ user: { id: 'me' } }}>
      <TravelEventPage route={{ params: { slug } }} />
    </AuthContext.Provider>
  );
}

function flyer(slug, ownerId) {
  return { slug, travel_date: '2026-12-15', user: { id: ownerId, name: 'Asha' } };
}

it('only offers a download for the signed-in owner of the current flyer', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let resolveOldFlyer;
  mockApiRequest.mockResolvedValueOnce(flyer('mine', 'me'))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveOldFlyer = resolve; }))
    .mockResolvedValueOnce(flyer('another-member', 'other'));

  let screen;
  await act(async () => { screen = TestRenderer.create(flyerPage('mine')); });

  const downloadButtons = () => screen.root.findAllByType('TouchableOpacity')
    .filter((button) => button.findAllByType('Text').some((text) => text.props.children === 'Download Flyer Card'));
  expect(downloadButtons()).toHaveLength(1);
  downloadButtons()[0].props.onPress();
  expect(mockDownload).toHaveBeenCalledTimes(1);

  await act(async () => { screen.update(flyerPage('old')); });
  expect(downloadButtons()).toHaveLength(0);

  await act(async () => { screen.update(flyerPage('another-member')); });
  await act(async () => { resolveOldFlyer(flyer('old', 'me')); });

  expect(downloadButtons()).toHaveLength(0);
  expect(screen.root.findAllByType('ShareCard')).toHaveLength(0);
  expect(screen.root.findByType('FlyerComments').props.slug).toBe('another-member');
  await act(async () => { screen.unmount(); });
});
