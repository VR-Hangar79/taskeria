// src/components/shared/UserAvatar.tsx
import React from 'react';
import { 
  UserCircleIcon, 
  UserIcon, 
  IdentificationIcon,
  AcademicCapIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Definiamo le icone predefinite disponibili
const presetIcons = {
  default: UserCircleIcon,
  simple: UserIcon,
  id: IdentificationIcon,
  academic: AcademicCapIcon,
  sparkles: SparklesIcon,
};

interface UserAvatarProps {
  type: keyof typeof presetIcons | 'image';
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  username?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  type = 'default',
  imageUrl,
  size = 'md',
  className,
  username,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  // Se è un'immagine caricata dall'utente
  if (type === 'image' && imageUrl) {
    return (
      <div className={clsx(
        'relative rounded-full overflow-hidden',
        sizeClasses[size],
        className
      )}>
        <img
          src={imageUrl}
          alt={`Avatar di ${username || 'utente'}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Se l'immagine non si carica, mostra l'icona predefinita
            e.currentTarget.style.display = 'none';
            type = 'default';
          }}
        />
      </div>
    );
  }

  // Se è un'icona predefinita
  const IconComponent = presetIcons[type] || presetIcons.default;

  return (
    <div className={clsx(
      'rounded-full bg-gradient-to-br from-primary-500 to-primary-600',
      'flex items-center justify-center text-white',
      sizeClasses[size],
      className
    )}>
      {username && username.length > 0 ? (
        <span className="font-medium">
          {username.charAt(0).toUpperCase()}
        </span>
      ) : (
        <IconComponent className={sizeClasses[size]} />
      )}
    </div>
  );
};

// Esempio di come utilizzare i diversi tipi di avatar nel menu a tendina
export const UserAvatarSelector: React.FC<{
  currentType: string;
  onSelect: (type: string) => void;
  onImageUpload: (file: File) => void;
}> = ({ currentType, onSelect, onImageUpload }) => {
  return (
    <div className="p-2 grid grid-cols-3 gap-2">
      {Object.keys(presetIcons).map((iconType) => (
        <button
          key={iconType}
          onClick={() => onSelect(iconType)}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            currentType === iconType 
              ? 'bg-primary-50 dark:bg-primary-900' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          <UserAvatar type={iconType as keyof typeof presetIcons} size="sm" />
        </button>
      ))}
      <label className="cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(file);
          }}
        />
        <div className="h-8 w-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <span className="text-xl">+</span>
        </div>
      </label>
    </div>
  );
};