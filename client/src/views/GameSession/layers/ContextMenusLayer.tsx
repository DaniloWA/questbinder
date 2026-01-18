import React from 'react';
import { TokenContextMenu } from '../../../components/vtt/TokenContextMenu';
import { MapContextMenu } from '../../../components/vtt/MapContextMenu';
import { AttackZoneContextMenu } from '../../../components/vtt/AttackZoneContextMenu';
import { useGameSession } from '../../../context/GameSessionContext';
import { useTokenHandler } from '../handlers/useTokenHandler';
import { useMapHandler } from '../handlers/useMapHandler';
import { useZoneHandler } from '../handlers/useZoneHandler';
import { useAccessControl } from '../../../hooks/useAccessControl';

interface ContextMenusLayerProps {
  session: ReturnType<typeof useGameSession>;
  tokenHandler: ReturnType<typeof useTokenHandler>;
  mapHandler: ReturnType<typeof useMapHandler>;
  zoneHandler: ReturnType<typeof useZoneHandler>;
}

export const ContextMenusLayer = ({ session, tokenHandler, mapHandler, zoneHandler }: ContextMenusLayerProps) => {
  const { isGM } = useAccessControl();

  return (
    <>
      {tokenHandler.tokenContextMenu && (
        <TokenContextMenu
          x={tokenHandler.tokenContextMenu.x}
          y={tokenHandler.tokenContextMenu.y}
          token={tokenHandler.tokenContextMenu.token}
          onClose={tokenHandler.closeTokenContextMenu}
          onEdit={() => tokenHandler.handleOpenTokenModal(tokenHandler.tokenContextMenu!.token)}
          onDuplicate={() => {
            if (tokenHandler.tokenContextMenu) tokenHandler.handleDuplicateToken(tokenHandler.tokenContextMenu.token);
            tokenHandler.closeTokenContextMenu();
          }}
          onDelete={() => {
            if (tokenHandler.tokenContextMenu) session.removeToken(tokenHandler.tokenContextMenu.token.id);
            tokenHandler.closeTokenContextMenu();
          }}
          onToggleVisibility={() => {
            if (tokenHandler.tokenContextMenu) session.updateToken(tokenHandler.tokenContextMenu.token.id, { isVisibleToPlayers: !tokenHandler.tokenContextMenu.token.isVisibleToPlayers });
            tokenHandler.closeTokenContextMenu();
          }}
          onToggleCondition={(condition) => {
            if (tokenHandler.tokenContextMenu) tokenHandler.handleToggleTokenCondition(tokenHandler.tokenContextMenu.token, condition);
          }}
          onOpenSheet={() => tokenHandler.handleOpenSheet(tokenHandler.tokenContextMenu!.token)}
        />
      )}

      {mapHandler.mapContextMenu && (
        <MapContextMenu
          x={mapHandler.mapContextMenu.x}
          y={mapHandler.mapContextMenu.y}
          worldX={mapHandler.mapContextMenu.worldX}
          worldY={mapHandler.mapContextMenu.worldY}
          isGM={isGM}
          canCreateToken={session.permissionHelper.can('tokenCreate')}
          obstacleId={mapHandler.mapContextMenu.obstacleId}
          triggerZoneId={mapHandler.mapContextMenu.triggerZoneId}
          audioZoneId={mapHandler.mapContextMenu.audioZoneId}
          onClose={mapHandler.closeMapContextMenu}
          onAddToken={() => {
            const gridSize = session.activeScene?.grid.size || 70;
            if (mapHandler.mapContextMenu) tokenHandler.handleOpenTokenModal('new', { x: Math.floor(mapHandler.mapContextMenu.worldX / gridSize), y: Math.floor(mapHandler.mapContextMenu.worldY / gridSize) });
          }}
          onAddLight={() => {
            const gridSize = session.activeScene?.grid.size || 70;
            if (mapHandler.mapContextMenu) session.addLightToken(Math.floor(mapHandler.mapContextMenu.worldX / gridSize), Math.floor(mapHandler.mapContextMenu.worldY / gridSize));
            mapHandler.closeMapContextMenu();
          }}
          onPing={() => {
            if (mapHandler.mapContextMenu) session.addPing(mapHandler.mapContextMenu.worldX, mapHandler.mapContextMenu.worldY);
            mapHandler.closeMapContextMenu();
          }}
          onToggleObstacleVisibility={mapHandler.handleToggleObstacleVisibility}
          onDeleteObstacle={mapHandler.handleDeleteObstacle}
          onEditTriggerZone={() => zoneHandler.handleEditTriggerZone(mapHandler.mapContextMenu?.triggerZoneId)}
          onDeleteTriggerZone={() => zoneHandler.handleDeleteTriggerZone(mapHandler.mapContextMenu?.triggerZoneId)}
          onEditAudioZone={() => zoneHandler.handleEditAudioZone(mapHandler.mapContextMenu?.audioZoneId)}
          onDeleteAudioZone={() => zoneHandler.handleDeleteAudioZone(mapHandler.mapContextMenu?.audioZoneId)}
        />
      )}

      {zoneHandler.attackZoneContextMenu && (() => {
        const zone = zoneHandler.attackZones.activeZones.find(z => z.id === zoneHandler.attackZoneContextMenu?.zoneId);
        return zone ? (
          <AttackZoneContextMenu
            x={zoneHandler.attackZoneContextMenu.x}
            y={zoneHandler.attackZoneContextMenu.y}
            zone={zone}
            onClose={() => zoneHandler.setAttackZoneContextMenu(null)}
            onEdit={() => zoneHandler.handleEditAttackZone(zone.id)}
            onDuplicate={() => zoneHandler.handleDuplicateAttackZone(zone.id)}
            onDelete={zoneHandler.handleDeleteAttackZone}
          />
        ) : null;
      })()}

    </>
  );
};
