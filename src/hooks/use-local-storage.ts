
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    // This function is only executed on the initial render on the client.
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === key && event.newValue) {
      try {
        setValue(JSON.parse(event.newValue));
      } catch (error) {
        console.error(`Error parsing new value for “${key}” from storage event:`, error);
      }
    }
  }, [key]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    
    // Check for changes from other tabs on mount
    const item = window.localStorage.getItem(key);
    if(item) {
        try {
            setValue(JSON.parse(item));
        } catch (error) {
            console.error(error);
        }
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, handleStorageChange]);

  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Manually dispatch a storage event so the current tab also updates
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(valueToStore) }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  };

  return { value, setValue: setStoredValue };
}
