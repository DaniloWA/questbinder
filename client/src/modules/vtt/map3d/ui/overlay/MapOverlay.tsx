import React from 'react';
import { useUiStore } from '../../store/uiStore';
import * as Toolbar from '@radix-ui/react-toolbar';
import { ToolPanel } from './ToolPanel';
import { VTTToolbarWrapper } from './VTTToolbarWrapper';
import { TokenContextMenu } from '@/components/vtt/TokenContextMenu';
import { useGameSession } from '@/context/GameSessionContext';

export const MapOverlay: React.FC = () => {
  const { isUiVisible, contextMenu, closeContextMenu } = useUiStore();

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
      <div className="pointer-events-none flex justify-center items-end pb-safe transition-all duration-300
                      w-full overflow-x-auto md:overflow-visible no-scrollbar py-8
                      2xl:scale-110 2xl:origin-bottom
                      3xl:scale-125 3xl:pb-8">

        <VTTToolbarWrapper />

      </div>

      {/* Context Menu Layer */}
      {contextMenu.visible && contextMenu.tokenId && (
        <ContextMenuWrapper
          tokenId={contextMenu.tokenId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

const ContextMenuWrapper: React.FC<{ tokenId: string; x: number; y: number; onClose: () => void; }> = ({ tokenId, x, y, onClose }) => {
  const { scenes, activeSceneId, updateToken, removeToken, addToken } = useGameSession();
  const activeScene = scenes.find(s => s.id === activeSceneId);
  const token = activeScene?.tokens.find(t => t.id === tokenId);

  if (!token) {
    onClose();
    return null;
  }

  const handleDuplicate = () => {
    const newToken = {
      ...token,
      id: crypto.randomUUID(),
      name: `${token.name} (Copy)`,
      x: token.x + 1, // Offset slightly
      y: token.y + 1
    };
    addToken(newToken);
  };

  return (
    <TokenContextMenu
      x={x}
      y={y}
      token={token}
      onClose={onClose}
      onEdit={() => console.log("Edit 3D Token")} // TODO: Open Sheet
      onDuplicate={handleDuplicate}
      onDelete={() => removeToken(tokenId)}
      onToggleVisibility={() => updateToken(tokenId, { isVisibleToPlayers: !token.isVisibleToPlayers })}
      onToggleCondition={(c) => {
        const set = new Set(token.conditions || []);
        if (set.has(c)) set.delete(c);
        else set.add(c);
        updateToken(tokenId, { conditions: Array.from(set) });
      }}
      onOpenSheet={() => console.log("Open Sheet 3D")}
    />
  );
};
