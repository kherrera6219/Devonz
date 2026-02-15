import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { DEFAULT_FEATURES, type FeatureKey, type FeatureConfig } from './defaults';

interface FeatureContextType {
  features: Record<string, FeatureConfig>;
  isEnabled: (key: FeatureKey) => boolean;
  setFeature: (key: FeatureKey, enabled: boolean) => void;
  resetFeatures: () => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

const STORAGE_KEY = 'devonz_features_v1';

export function FeatureProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<Record<string, FeatureConfig>>(DEFAULT_FEATURES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        // Merge stored config with defaults to ensure new flags exist
        setFeatures((prev) => {
          const merged = { ...prev };
          Object.keys(parsed).forEach((key) => {
            if (merged[key]) {
              merged[key].enabled = parsed[key].enabled;
            }
          });

          return merged;
        });
      }
    } catch (e) {
      console.error('Failed to load feature flags:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist to storage on change
  const saveFeatures = (newFeatures: Record<string, FeatureConfig>) => {
    setFeatures(newFeatures);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFeatures));
    } catch (e) {
      console.error('Failed to save feature flags:', e);
    }
  };

  const isEnabled = (key: FeatureKey): boolean => {
    return features[key]?.enabled ?? false;
  };

  const setFeature = (key: FeatureKey, enabled: boolean) => {
    if (!features[key]) {
      console.warn(`Attempted to set unknown feature flag: ${key}`);
      return;
    }

    const newFeatures = {
      ...features,
      [key]: {
        ...features[key],
        enabled,
      },
    };
    saveFeatures(newFeatures);
  };

  const resetFeatures = () => {
    saveFeatures(DEFAULT_FEATURES);
  };

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <FeatureContext.Provider value={{ features, isEnabled, setFeature, resetFeatures }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);

  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }

  return context;
}
