// src/types/preferences.ts
export interface LayoutPreferences {
    navigationStyle: 'sidebar' | 'topbar' | 'bottombar';
    sidebarMode: 'expanded' | 'collapsed' | 'auto';
    devicePreferences: {
      mobile: 'bottombar' | 'topbar';
      tablet: 'sidebar' | 'topbar';
      desktop: 'sidebar' | 'topbar';
    };
  }