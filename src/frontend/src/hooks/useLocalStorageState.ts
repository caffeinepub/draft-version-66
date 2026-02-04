import { useState, useEffect } from 'react';

/**
 * Hook to persist a boolean state in localStorage with SSR-safe initialization
 * @param key - localStorage key
 * @param defaultValue - default value if key doesn't exist
 * @returns [value, setValue] tuple
 */
export function useLocalStorageState(key: string, defaultValue: boolean): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    // SSR-safe: only access localStorage on client
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    // Persist to localStorage whenever value changes
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
