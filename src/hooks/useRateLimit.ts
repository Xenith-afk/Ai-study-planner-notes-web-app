import { useState, useCallback, useRef } from 'react';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: number | null;
}

export const useRateLimit = (config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) => {
  const requestTimestamps = useRef<number[]>([]);
  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    remainingRequests: config.maxRequests,
    resetTime: null,
  });

  const cleanOldRequests = useCallback(() => {
    const now = Date.now();
    requestTimestamps.current = requestTimestamps.current.filter(
      (timestamp) => now - timestamp < config.windowMs
    );
  }, [config.windowMs]);

  const checkRateLimit = useCallback((): boolean => {
    cleanOldRequests();
    
    const currentCount = requestTimestamps.current.length;
    const isLimited = currentCount >= config.maxRequests;
    
    if (isLimited) {
      const oldestRequest = requestTimestamps.current[0];
      const resetTime = oldestRequest + config.windowMs;
      setState({
        isLimited: true,
        remainingRequests: 0,
        resetTime,
      });
      return false;
    }

    setState({
      isLimited: false,
      remainingRequests: config.maxRequests - currentCount,
      resetTime: null,
    });
    return true;
  }, [config.maxRequests, config.windowMs, cleanOldRequests]);

  const recordRequest = useCallback(() => {
    if (checkRateLimit()) {
      requestTimestamps.current.push(Date.now());
      cleanOldRequests();
      setState((prev) => ({
        ...prev,
        remainingRequests: Math.max(0, prev.remainingRequests - 1),
      }));
      return true;
    }
    return false;
  }, [checkRateLimit, cleanOldRequests]);

  const getTimeUntilReset = useCallback((): number => {
    if (!state.resetTime) return 0;
    return Math.max(0, state.resetTime - Date.now());
  }, [state.resetTime]);

  return {
    ...state,
    checkRateLimit,
    recordRequest,
    getTimeUntilReset,
  };
};
