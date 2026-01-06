import React from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';
import { useUiStore } from '../../store/uiStore';
// Uselucide-react icons if available, otherwise text for now

export const ToolPanel: React.FC = () => {
  const { activeMode, setMode } = useUiStore();

  return (
    <Toolbar.Root
      style={{
        display: 'flex',
        padding: '8px',
        background: 'rgba(30,30,30,0.9)',
        borderRadius: '8px',
        gap: '4px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}
    >
      <Toolbar.ToggleGroup type="single" value={activeMode} onValueChange={(val: any) => val && setMode(val)}>
        <Toolbar.ToggleItem
          value="select"
          style={{ padding: '8px', background: activeMode === 'select' ? '#444' : 'transparent', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Select
        </Toolbar.ToggleItem>
        <Toolbar.ToggleItem
          value="pan"
          style={{ padding: '8px', background: activeMode === 'pan' ? '#444' : 'transparent', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Pan
        </Toolbar.ToggleItem>
        <Toolbar.ToggleItem
          value="measure"
          style={{ padding: '8px', background: activeMode === 'measure' ? '#444' : 'transparent', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Measure
        </Toolbar.ToggleItem>
      </Toolbar.ToggleGroup>
    </Toolbar.Root>
  );
};
