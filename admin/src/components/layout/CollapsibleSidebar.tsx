interface CollapsibleSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ collapsed, onToggle }) => {
  // Importiamo menuItems dal DashboardLayout o creiamo un file di configurazione separato
  return (
    <div className={clsx(
      'transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {menuItems.map(item => (
        <div key={item.path} className="flex items-center p-2">
          <span className="text-xl">{item.icon}</span>
          {!collapsed && (
            <span className="ml-3 transition-opacity duration-300">
              {item.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};