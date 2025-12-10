import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface FeatureUsage {
  tutor: number;
  exam: number;
  review: number;
  adaptive: number;
}

interface RateLimitConfig {
  tutor: { max: number; windowMs: number; name: string };
  exam: { max: number; windowMs: number; name: string };
  review: { max: number; windowMs: number; name: string };
  adaptive: { max: number; windowMs: number; name: string };
}

const DEFAULT_CONFIG: RateLimitConfig = {
  tutor: { max: 15, windowMs: 60000, name: 'AI Tutor' },
  exam: { max: 5, windowMs: 5 * 60000, name: 'Mock Exam' },
  review: { max: 10, windowMs: 5 * 60000, name: 'Spaced Review' },
  adaptive: { max: 10, windowMs: 5 * 60000, name: 'Adaptive AI' },
};

// Singleton to track usage across components
const globalTimestamps: Record<keyof FeatureUsage, number[]> = {
  tutor: [],
  exam: [],
  review: [],
  adaptive: [],
};

// Track which features were limited (for reset notifications)
const wasLimited: Record<keyof FeatureUsage, boolean> = {
  tutor: false,
  exam: false,
  review: false,
  adaptive: false,
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

  const checkForResets = useCallback(() => {
    const features: (keyof FeatureUsage)[] = ['tutor', 'exam', 'review', 'adaptive'];
    
    features.forEach((feature) => {
      cleanOldRequests(feature);
      const currentCount = globalTimestamps[feature].length;
      const max = DEFAULT_CONFIG[feature].max;
      const isCurrentlyLimited = currentCount >= max;
      
      // If was limited but now has availability, show notification
      if (wasLimited[feature] && !isCurrentlyLimited) {
        toast.success(`${DEFAULT_CONFIG[feature].name} rate limit refreshed!`, {
          description: `You can now make ${max - currentCount} more requests.`,
          duration: 4000,
        });
      }
      
      wasLimited[feature] = isCurrentlyLimited;
    });
  }, [cleanOldRequests]);

  const updateUsage = useCallback(() => {
    const features: (keyof FeatureUsage)[] = ['tutor', 'exam', 'review', 'adaptive'];
    features.forEach(cleanOldRequests);
    
    // Check for resets before updating usage
    checkForResets();
    
    setUsage({
      tutor: globalTimestamps.tutor.length,
      exam: globalTimestamps.exam.length,
      review: globalTimestamps.review.length,
      adaptive: globalTimestamps.adaptive.length,
    });
  }, [cleanOldRequests, checkForResets]);

  // Update usage periodically
  useEffect(() => {
    updateUsage();
    const interval = setInterval(updateUsage, 1000);
    return () => clearInterval(interval);
  }, [updateUsage]);

  const recordUsage = useCallback((feature: keyof FeatureUsage) => {
    globalTimestamps[feature].push(Date.now());
    
    // Check if this request causes rate limiting
    const max = DEFAULT_CONFIG[feature].max;
    if (globalTimestamps[feature].length >= max) {
      wasLimited[feature] = true;
    }
    
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
