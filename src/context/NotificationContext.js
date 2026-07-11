import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { AuthContext } from './AuthProvider';
import { useApi } from '../hooks/useApi';

export const NotificationContext = createContext({
  unreadDm: 0,
  unreadChannel: 0,
  activeChat: null,
  setActiveChat: () => {},
  markChatRead: () => {},
  refreshCounts: async () => {},
});

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const { apiRequest } = useApi();
  const [unreadDm, setUnreadDm] = useState(0);
  const [unreadChannel, setUnreadChannel] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const lastDmTs = useRef({});
  const lastChannelTs = useRef(null);
  const pollRef = useRef(null);

  const markChatRead = useCallback((type, id) => {
    if (type === 'dm') {
      lastDmTs.current[id] = Date.now();
      setUnreadDm(0);
    } else if (type === 'channel') {
      lastChannelTs.current = Date.now();
      setUnreadChannel(0);
    }
  }, []);

  const refreshCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [dmsData, channelsData] = await Promise.all([
        apiRequest('/api/dms'),
        apiRequest('/api/channels'),
      ]);
      const conversations = dmsData.conversations || [];
      let dmUnread = 0;
      for (const conv of conversations) {
        const lastSeen = lastDmTs.current[conv.other_user_id] || 0;
        const updated = new Date(conv.updated_at || 0).getTime();
        if (updated > lastSeen) dmUnread += 1;
      }
      setUnreadDm(dmUnread);

      const general =
        (channelsData.channels || []).find((c) => c.name?.toLowerCase() === 'general') ||
        (channelsData.channels || [])[0];
      if (general?.id) {
        const msgData = await apiRequest(`/api/channels/${general.id}/messages?limit=1`);
        const latest = (msgData.messages || []).slice(-1)[0];
        if (latest) {
          const ts = new Date(latest.created_at).getTime();
          const lastSeen = lastChannelTs.current || 0;
          if (ts > lastSeen && latest.user_id !== user.id) {
            setUnreadChannel(1);
          } else if (ts <= lastSeen || latest.user_id === user.id) {
            setUnreadChannel(0);
          }
        }
      }
    } catch (e) {
      console.warn('refreshCounts', e);
    }
  }, [user, apiRequest]);

  useEffect(() => {
    if (!user) return undefined;
    refreshCounts();
    pollRef.current = setInterval(refreshCounts, 30000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshCounts();
    });
    return () => {
      clearInterval(pollRef.current);
      sub.remove();
    };
  }, [user, refreshCounts]);

  return (
    <NotificationContext.Provider
      value={{
        unreadDm,
        unreadChannel,
        activeChat,
        setActiveChat,
        markChatRead,
        refreshCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
