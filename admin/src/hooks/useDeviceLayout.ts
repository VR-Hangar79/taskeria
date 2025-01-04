// src/hooks/useDeviceLayout.ts
import { useState, useEffect } from 'react';

export const useDeviceLayout = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [preferredLayout, setPreferredLayout] = useState<string | null>(
    localStorage.getItem('preferred_layout')
  );

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;
      
      if (/Mobi|Android/i.test(ua) || width < 768) {
        return 'mobile';
      } else if (/Tablet|iPad/i.test(ua) || width < 1024) {
        return 'tablet';
      }
      return 'desktop';
    };

    const handleResize = () => {
      setDeviceType(checkDevice());
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getOptimalLayout = (userPreferences: LayoutPreferences) => {
    if (preferredLayout) {
      return preferredLayout;
    }
    
    return userPreferences.devicePreferences[deviceType];
  };

  return { deviceType, getOptimalLayout };
};