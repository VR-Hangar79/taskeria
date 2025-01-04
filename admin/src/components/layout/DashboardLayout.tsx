import React, { useState, Fragment } from 'react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  SunIcon, 
  MoonIcon 
} from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { Breadcrumb } from '../shared/Breadcrumb';
import { NotificationsMenu } from '../shared/NotificationsMenu';
import { UserAvatar } from '../shared/UserAvatar';
import { MobileNavigation } from '../shared/MobileNavigation';

// Definiamo le voci del menu con le loro icone
const menuItems = [
  { 
    name: 'Dashboard',
    path: '/',
    icon: '📊',
    description: 'Panoramica generale del sistema'
  },
  { 
    name: 'Prodotti',
    path: '/products',
    icon: '🍕',
    description: 'Gestione del catalogo prodotti'
  },
  { 
    name: 'Ingredienti',
    path: '/ingredients',
    icon: '🥗',
    description: 'Gestione ingredienti e scorte'
  },
  { 
    name: 'Allergeni',
    path: '/allergens',
    icon: '⚠️',
    description: 'Gestione degli allergeni'
  },
  { 
    name: 'Menu',
    path: '/menus',
    icon: '📋',
    description: 'Composizione e gestione menu'
  },
  { 
    name: 'Statistiche',
    path: '/statistics',
    icon: '📈',
    description: 'Analisi vendite e performance'
  },
  { 
    name: 'Impostazioni',
    path: '/settings',
    icon: '⚙️',
    description: 'Configurazione del sistema'
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Gestione dello stato della sidebar mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Gestione del tema chiaro/scuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Hook per ottenere il percorso corrente
  const location = useLocation();

  // Funzione per gestire il cambio di tema
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Componente MenuItem riutilizzabile
  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => (
    <a
      href={item.path}
      className={clsx(
        'flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-150 ease-in-out',
        location.pathname === item.path
          ? 'bg-primary-500 text-white'
          : 'text-gray-700 hover:bg-primary-50 dark:text-gray-200 dark:hover:bg-gray-800'
      )}
    >
      <span className="text-xl mr-3" aria-hidden="true">
        {item.icon}
      </span>
      <div className="flex flex-col">
        <span className="font-medium">{item.name}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {item.description}
        </span>
      </div>
    </a>
  );

  return (
    <div className={clsx('h-screen flex bg-gray-50 dark:bg-gray-900')}>
      {/* Overlay per mobile quando la sidebar è aperta */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - versione desktop */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg',
        'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header della sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b dark:border-gray-700">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Taskeria Admin
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Menu della sidebar */}
        <nav className="mt-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <MenuItem key={item.path} item={item} />
          ))}
        </nav>
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col lg:pl-64">

      {/* Header principale */}
      <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex flex-col">
        <div className="h-full flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <Breadcrumb />
          </div>

          {/* Azioni dell'header */}
          <div className="flex items-center space-x-4">
            {/* Menu notifiche */}
            <NotificationsMenu />

            {/* Toggle tema chiaro/scuro */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isDarkMode ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Menu utente */}
            <div className="relative">
              <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <UserAvatar 
                  type="default"  // o qualsiasi altro tipo predefinito
                  username="Admin"
                  size="md"
                />
                <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Admin
                </span>
              </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#profilo"
                            className={clsx(
                              active ? 'bg-gray-50 dark:bg-gray-700/50' : '',
                              'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                            )}
                          >
                            Profilo
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#impostazioni"
                            className={clsx(
                              active ? 'bg-gray-50 dark:bg-gray-700/50' : '',
                              'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                            )}
                          >
                            Impostazioni
                          </a>
                        )}
                      </Menu.Item>
                      <div className="border-t border-gray-100 dark:border-gray-700" />
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#logout"
                            className={clsx(
                              active ? 'bg-gray-50 dark:bg-gray-700/50' : '',
                              'block px-4 py-2 text-sm text-red-600 dark:text-red-400'
                            )}
                          >
                            Esci
                          </a>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </header>

        {/* Area contenuto principale */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNavigation />
          {/* Aggiungiamo padding-bottom per evitare che il contenuto finisca sotto la navbar mobile */}
          <div className="h-16" />
        </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;