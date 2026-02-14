import type { ReactNode } from 'react';
import { useFeatures } from './FeatureContext';
import type { FeatureKey } from './defaults';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { isEnabled } = useFeatures();

  if (isEnabled(feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
