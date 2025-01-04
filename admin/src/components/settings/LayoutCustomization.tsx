// src/components/settings/LayoutCustomization.tsx
const LayoutCustomization = () => {
    const [preferences, setPreferences] = useState<LayoutPreferences>(() => 
      JSON.parse(localStorage.getItem('layout_preferences') ?? '{}')
    );
  
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Personalizzazione Layout</h3>
          <p className="text-sm text-gray-500">
            Personalizza come vuoi visualizzare la navigazione su diversi dispositivi
          </p>
        </div>
  
        {/* Device specific preferences */}
        {(['mobile', 'tablet', 'desktop'] as const).map(device => (
          <div key={device}>
            <label className="text-sm font-medium">{device}</label>
            <select
              value={preferences.devicePreferences[device]}
              onChange={e => updatePreference(device, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300"
            >
              <option value="sidebar">Sidebar</option>
              <option value="topbar">Menu Superiore</option>
              {device === 'mobile' && (
                <option value="bottombar">Menu Inferiore</option>
              )}
            </select>
          </div>
        ))}
      </div>
    );
  };