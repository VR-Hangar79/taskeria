// src/components/shared/NotificationsMenu.tsx
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { 
  ExclamationCircleIcon, 
  ClockIcon, 
  ShoppingCartIcon 
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

// Esempio di notifiche
const notifications = [
  {
    id: 1,
    type: 'warning',
    message: 'Mozzarella in esaurimento (2kg rimanenti)',
    time: '5 minuti fa',
    icon: ExclamationCircleIcon,
    color: 'text-yellow-500',
  },
  {
    id: 2,
    type: 'info',
    message: 'Nuovo ordine: 2 Margherite, 1 Marinara',
    time: '10 minuti fa',
    icon: ShoppingCartIcon,
    color: 'text-blue-500',
  },
  {
    id: 3,
    type: 'system',
    message: 'Backup automatico completato',
    time: '1 ora fa',
    icon: ClockIcon,
    color: 'text-green-500',
  },
];

export const NotificationsMenu = () => {
  const unreadCount = notifications.length;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
        <span className="sr-only">Visualizza notifiche</span>
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
            {unreadCount}
          </span>
        )}
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
        <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Notifiche
            </h3>
          </div>

          <div className="py-2 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <Menu.Item key={notification.id}>
                {({ active }) => (
                  <button
                    className={clsx(
                      'w-full px-4 py-3 flex items-start space-x-3 text-left',
                      active && 'bg-gray-50 dark:bg-gray-700/50'
                    )}
                  >
                    <notification.icon 
                      className={clsx('h-5 w-5 mt-1', notification.color)} 
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.time}
                      </p>
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>

          <div className="py-2 px-4">
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Visualizza tutte le notifiche
            </button>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};