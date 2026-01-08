import React from 'react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TokenTabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const TokenTabNav: React.FC<TokenTabNavProps> = ({
  tabs,
  activeTab,
  onChange,
}) => {
  return (
    <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-2 md:px-4 overflow-x-auto hide-scrollbar shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-2.5 md:px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap
            ${activeTab === tab.id
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }
          `}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
