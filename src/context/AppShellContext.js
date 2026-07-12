import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const defaultHeader = { variant: 'app', title: '' };

export const AppShellContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  searchPlaceholder: 'Search',
  header: defaultHeader,
  setHeader: () => {},
});

export function AppShellProvider({ children, placeholder = 'Search' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [header, setHeaderState] = useState(defaultHeader);

  const setHeader = useCallback((next) => {
    setHeaderState((prev) => ({ ...prev, ...next }));
  }, []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      searchPlaceholder: placeholder,
      header,
      setHeader,
    }),
    [searchQuery, placeholder, header, setHeader]
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  return useContext(AppShellContext);
}
