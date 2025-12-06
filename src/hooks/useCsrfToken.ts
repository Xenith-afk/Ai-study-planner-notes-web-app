import { useState, useEffect, useCallback } from 'react';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';
const TOKEN_VALIDITY_MS = 30 * 60 * 1000; // 30 minutes

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const useCsrfToken = () => {
  const [token, setToken] = useState<string>('');

  const refreshToken = useCallback(() => {
    const newToken = generateToken();
    const expiry = Date.now() + TOKEN_VALIDITY_MS;
    
    sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
    sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, expiry.toString());
    setToken(newToken);
    
    return newToken;
  }, []);

  const validateToken = useCallback((tokenToValidate: string): boolean => {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    
    if (!storedToken || !expiry) return false;
    if (Date.now() > parseInt(expiry, 10)) {
      refreshToken();
      return false;
    }
    
    return tokenToValidate === storedToken;
  }, [refreshToken]);

  const getToken = useCallback((): string => {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    
    if (!storedToken || !expiry || Date.now() > parseInt(expiry, 10)) {
      return refreshToken();
    }
    
    return storedToken;
  }, [refreshToken]);

  useEffect(() => {
    const existingToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    
    if (!existingToken || !expiry || Date.now() > parseInt(expiry, 10)) {
      refreshToken();
    } else {
      setToken(existingToken);
    }
  }, [refreshToken]);

  return {
    token,
    getToken,
    validateToken,
    refreshToken,
  };
};
