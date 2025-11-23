import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Tooltip } from './Tooltip';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip content={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'} position="right" delay={200}>
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500
          ${theme === 'light' 
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-primary-600' 
            : 'bg-slate-800 text-yellow-400 hover:bg-slate-700 hover:text-yellow-300'
          }
        `}
        aria-label="Alternar tema"
      >
        <div className="relative w-6 h-6">
          <Sun 
            className={`
              absolute inset-0 transform transition-all duration-500 ease-in-out
              ${theme === 'light' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}
            `} 
            size={24}
          />
          <Moon 
            className={`
              absolute inset-0 transform transition-all duration-500 ease-in-out
              ${theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}
            `} 
            size={24} 
          />
        </div>
      </button>
    </Tooltip>
  );
};