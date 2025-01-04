// src/contexts/LayoutContext.tsx
const LayoutContext = createContext<{
    preferences: LayoutPreferences;
    updatePreferences: (newPrefs: Partial<LayoutPreferences>) => void;
  }>(null!);
  
  export const LayoutProvider = ({ children }) => {
    const [preferences, setPreferences] = useState<LayoutPreferences>(() => ({
      navigationStyle: 'auto',
      sidebarMode: 'expanded',
      devicePreferences: {
        mobile: 'bottombar',
        tablet: 'sidebar',
        desktop: 'sidebar'
      },
      ...JSON.parse(localStorage.getItem('layout_preferences') ?? '{}')
    }));
  
    // Aggiorna e persisti le preferenze
    const updatePreferences = useCallback((newPrefs: Partial<LayoutPreferences>) => {
      setPreferences(prev => {
        const updated = { ...prev, ...newPrefs };
        localStorage.setItem('layout_preferences', JSON.stringify(updated));
        return updated;
      });
    }, []);
  
    return (
      <LayoutContext.Provider value={{ preferences, updatePreferences }}>
        {children}
      </LayoutContext.Provider>
    );
  };