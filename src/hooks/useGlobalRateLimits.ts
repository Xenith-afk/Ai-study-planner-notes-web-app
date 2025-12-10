import { useState, useCallback, useRef, useEffect } from 'react';

interface FeatureUsage {
  tutor: number;
  exam: number;
  review: number;
  adaptive: number;
}

interface RateLimitConfig {
  tutor: { max: number; windowMs: number };
  exam: { max: number; windowMs: number };
  review: { max: number; windowMs: number };
  adaptive: { max: number; windowMs: number };
}

const DEFAULT_CONFIG: RateLimitConfig = {
  tutor: { max: 15, windowMs: 60000 },
  exam: { max: 5, windowMs: 5 * 60000 },
  review: { max: 10, windowMs: 5 * 60000 },
  adaptive: { max: 10, windowMs: 5 * 60000 },
};

// Singleton to track usage across components
const globalTimestamps: Record<keyof FeatureUsage, number[]> = {
  tutor: [],
  exam: [],
  review: [],
  adaptive: [],
};

export const useGlobalRateLimits = () => {
  const [usage, setUsage] = useState<FeatureUsage>({
    tutor: 0,
    exam: 0,
    review: 0,
    adaptive: 0,
  });

  const cleanOldRequests = useCallback((feature: keyof FeatureUsage) => {
    const now = Date.now();
    const windowMs = DEFAULT_CONFIG[feature].windowMs;
    globalTimestamps[feature] = globalTimestamps[feature].filter(
      (timestamp) => now - timestamp < windowMs
    );
  }, []);

  const updateUsage = useCallback(() => {
    const features: (keyof FeatureUsage)[] = ['tutor', 'exam', 'review', 'adaptive'];
    features.forEach(cleanOldRequests);
    
    setUsage({
      tutor: globalTimestamps.tutor.length,
      exam: globalTimestamps.exam.length,
      review: globalTimestamps.review.length,
      adaptive: globalTimestamps.adaptive.length,
    });
  }, [cleanOldRequests]);

  // Update usage periodically
  useEffect(() => {
    updateUsage();
    const interval = setInterval(updateUsage, 1000);
    return () => clearInterval(interval);
  }, [updateUsage]);

  const recordUsage = useCallback((feature: keyof FeatureUsage) => {
    globalTimestamps[feature].push(Date.now());
    updateUsage();
  }, [updateUsage]);

  const isLimited = useCallback((feature: keyof FeatureUsage): boolean => {
    cleanOldRequests(feature);
    return globalTimestamps[feature].length >= DEFAULT_CONFIG[feature].max;
  }, [cleanOldRequests]);

  const getRemainingRequests = useCallback((feature: keyof FeatureUsage): number => {
    cleanOldRequests(feature);
    return Math.max(0, DEFAULT_CONFIG[feature].max - globalTimestamps[feature].length);
  }, [cleanOldRequests]);

  return {
    usage,
    recordUsage,
    isLimited,
    getRemainingRequests,
    config: DEFAULT_CONFIG,
  };
};
