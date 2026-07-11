import React, { createContext, useContext, useMemo, useState } from 'react';

export const AppShellContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  searchPlaceholder: 'Search',
});

export function AppShellProvider({ children, placeholder = 'Search' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const value = useMemo(
    () => ({ searchQuery, setSearchQuery, searchPlaceholder: placeholder }),
    [searchQuery, placeholder]
  );
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  return useContext(AppShellContext);
}
