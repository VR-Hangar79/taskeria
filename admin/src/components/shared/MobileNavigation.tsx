// src/components/shared/MobileNavigation.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Raggruppiamo le voci di menu per categoria
  const menuGroups = {
    main: [
      { 
        name: 'Dashboard',
        path: '/',
        icon: '📊',
      },
      {
        name: 'Catalogo',
        icon: '📋',
        submenu: [
          { name: 'Prodotti', path: '/products', icon: '🍕' },
          { name: 'Ingredienti', path: '/ingredients', icon: '🥗' },
          { name: 'Allergeni', path: '/allergens', icon: '⚠️' },
        ]
      },
      {
        name: 'Gestione',
        icon: '⚙️',
        submenu: [
          { name: 'Menu', path: '/menus', icon: '📋' },
          { name: 'Statistiche', path: '/statistics', icon: '📈' },
          { name: 'Impostazioni', path: '/settings', icon: '⚙️' },
        ]
      }
    ]
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 lg:hidden">
      <nav className="flex justify-around">
        {menuGroups.main.map((item) => (
          item.submenu ? (
            <Menu key={item.name} as="div" className="relative">
              {({ open }) => (
                <>
                  <Menu.Button
                    className={clsx(
                      'flex flex-col items-center p-3 w-full',
                      open ? 'text-primary-500' : 'text-gray-600 dark:text-gray-300'
                    )}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs mt-1">{item.name}</span>
                    <ChevronUpIcon
                      className={clsx(
                        'h-4 w-4 transition-transform',
                        open ? 'rotate-0' : 'rotate-180'
                      )}
                    />
                  </Menu.Button>

                  <Transition
                    show={open}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Menu.Items
                      static
                      className="absolute bottom-full mb-2 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="py-1">
                        {item.submenu.map((subItem) => (
                          <Menu.Item key={subItem.path}>
                            {({ active }) => (
                              <button
                                onClick={() => navigate(subItem.path)}
                                className={clsx(
                                  'flex items-center w-full px-4 py-2 text-sm',
                                  active
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                )}
                              >
                                <span className="mr-3">{subItem.icon}</span>
                                {subItem.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          ) : (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center p-3',
                location.pathname === item.path
                  ? 'text-primary-500'
                  : 'text-gray-600 dark:text-gray-300'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          )
        ))}
      </nav>
    </div>
  );
};