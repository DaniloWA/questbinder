import React from 'react';
import { useUiStore } from '../../store/uiStore';
import * as Toolbar from '@radix-ui/react-toolbar';
import { ToolPanel } from './ToolPanel';

export const MapOverlay: React.FC = () => {
  const isUiVisible = useUiStore(state => state.isUiVisible);

  if (!isUiVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none', // Let clicks pass through to canvas
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '16px'
    }}>
      {/* Top Bar (e.g. Menu, Settings) */}
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: '8px' }}>
        {/* Placeholder for top bar */}
      </div>

      {/* Bottom/Side Tools */}
      <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'center' }}>
        <ToolPanel />
      </div>
    </div>
  );
};
