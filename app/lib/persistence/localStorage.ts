// Client-side storage utilities
const isClient = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalStorage(key: string): any | null {
  if (!isClient) {
    return null;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setLocalStorage(key: string, value: any): void {
  if (!isClient) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}
