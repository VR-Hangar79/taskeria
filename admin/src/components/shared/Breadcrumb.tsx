// src/components/shared/Breadcrumb.tsx
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Link, useLocation } from 'react-router-dom';

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mappa dei titoli per rendere i percorsi più leggibili
  const pathTitles: { [key: string]: string } = {
    products: 'Prodotti',
    ingredients: 'Ingredienti',
    allergens: 'Allergeni',
    menus: 'Menù',
    statistics: 'Statistiche',
    settings: 'Impostazioni',
    'new': 'Nuovo',
    'edit': 'Modifica',
  };

  return (
    <nav className="flex items-center space-x-1 text-sm font-medium text-gray-500 dark:text-gray-400">
      <Link
        to="/"
        className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <HomeIcon className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={name} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="text-gray-900 dark:text-white">
                {pathTitles[name] || name}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {pathTitles[name] || name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};