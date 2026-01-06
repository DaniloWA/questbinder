import React from 'react';
import { useUiStore } from '../../store/uiStore';
import * as Toolbar from '@radix-ui/react-toolbar';
import { ToolPanel } from './ToolPanel';
import { VTTToolbarWrapper } from './VTTToolbarWrapper';

export const MapOverlay: React.FC = () => {
  const isUiVisible = useUiStore(state => state.isUiVisible);

  if (!isUiVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none">

      {/* Top Bar (Menu, Settings) - Future Proofing */}
      <div className="pointer-events-auto flex gap-2 z-50">
        {/* Placeholder: <MenuButton /> */}
      </div>

      {/* Center - Viewport Interaction Area (Empty for now) */}
      <div className="flex-1 min-h-0" />

      {/* Bottom/Side Tools - Responsive Container */}
      {/* 
          Mobile: Bottom aligned, scrollable horizontally if needed.
          Desktop: Centered bottom.
          Large Screens: Scaled up (110% on 2xl, 125% on 4k).
      */}
      <div className="pointer-events-auto flex justify-center items-end pb-safe transition-all duration-300
                      w-full overflow-x-auto md:overflow-visible no-scrollbar py-8
                      2xl:scale-110 2xl:origin-bottom
                      3xl:scale-125 3xl:pb-8">

        <VTTToolbarWrapper />

      </div>
    </div>
  );
};
