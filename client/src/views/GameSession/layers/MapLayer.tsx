import React, { memo } from 'react';
import { MapCanvas } from '../../../components/vtt/map/MapCanvas';
import { useGameSession } from '../../../context/GameSessionContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAuth } from '../../../context/AuthContext';
import { useTokenHandler } from '../handlers/useTokenHandler';
import { useMapHandler } from '../handlers/useMapHandler';
import { useZoneHandler } from '../handlers/useZoneHandler';

// Define the Props interface based on what MapCanvas expects + what we extracted
interface MapLayerProps {
  session: ReturnType<typeof useGameSession>;
  tokenHandler: ReturnType<typeof useTokenHandler>;
  mapHandler: ReturnType<typeof useMapHandler>;
  zoneHandler: ReturnType<typeof useZoneHandler>;
  isModalOpen: boolean;
}

export const MapLayer = memo(({ session, tokenHandler, mapHandler, zoneHandler, isModalOpen }: MapLayerProps) => {
  const { isGM } = useAccessControl();
  const { user: currentUser } = useAuth();

  return (
    <div className="absolute inset-0 z-0">
      <MapCanvas
        scene={session.activeScene}
        tokens={session.activeScene?.tokens || []}
        viewport={session.viewport}
        isGM={isGM}
        gmViewMode={session.gmViewMode}
        previewPlayerId={session.previewPlayerId}
        currentUser={currentUser}
        activeTool={session.activeTool}
        isChatting={session.isChatting}
        movementPath={session.movementPath}
        pings={session.pings}
        drawingObstacle={session.drawingObstacle}
        draftPolyPoints={session.draftPolyPoints}
        selectedTokenIds={session.selectedTokenIds}
        remoteDrags={session.remoteDrags}
        permissions={session.permissions}
        campaign={session.campaign}
        cursorSettings={session.cursorSettings}
        wandSettings={session.wandSettings}
        drawingLightZone={session.drawingLightZone}
        drawingAudioZone={session.drawingAudioZone}

        setViewport={session.setViewport}
        moveToken={session.moveToken}
        moveTokens={session.moveTokens}
        selectToken={session.selectToken}
        clearSelection={session.clearSelection}

        updateFog={session.updateFog}
        setActiveTool={session.setActiveTool}
        onTokenContextMenu={tokenHandler.handleTokenContextMenu}
        onMapContextMenu={mapHandler.handleMapContextMenu}
        setMovementPath={session.setMovementPath}
        addObstacles={session.addObstacles}
        updateObstacle={session.updateObstacle}
        setDrawingObstacle={session.setDrawingObstacle}
        setDraftPolyPoints={session.setDraftPolyPoints}
        updateToken={session.updateToken}
        onOpenSheet={tokenHandler.handleOpenSheet}
        emitTokenDrag={session.emitTokenDrag}
        setDrawingLightZone={session.setDrawingLightZone}
        addLightZones={session.addLightZones}
        setDrawingAudioZone={session.setDrawingAudioZone}
        addAudioZones={session.addAudioZones}
        emitCursorMove={session.emitCursorMove}
        remoteCursors={session.remoteCursors}
        remoteCursorsRef={session.remoteCursorsRef}
        remoteViewports={session.remoteViewports}
        players={session.players}

        drawingTriggerZone={session.drawingTriggerZone}
        setDrawingTriggerZone={session.setDrawingTriggerZone}
        addTriggerZones={session.addTriggerZones}
        removeTriggerZone={session.removeTriggerZone}

        campaignCharacters={session.campaignCharacters}
        onRollDice={(formula, label) => session.rollDice(label, formula)}
        onCharacterUpdate={session.updateCharacter}

        // Attack Zones integration
        attackZoneResults={zoneHandler.attackZones.activeZoneResults}
        previewZoneResult={zoneHandler.attackZones.previewZoneResult}
        onAttackZoneContextMenu={zoneHandler.handleAttackZoneContextMenu}
        onUpdateAttackZone={zoneHandler.attackZones.updateZone}

        // Attack Zone Placement Mode
        isPlacingAttackZone={zoneHandler.attackZones.isPlacingZone}
        onUpdatePreviewOrigin={(origin) => zoneHandler.attackZones.updatePreview({ origin })}
        onConfirmAttackZonePlacement={zoneHandler.attackZones.confirmPreview}
        onCancelAttackZonePlacement={zoneHandler.attackZones.cancelPreview}

        // Performance
        isModalOpen={isModalOpen}
        isContexting={!!tokenHandler.tokenContextMenu || !!mapHandler.mapContextMenu || !!zoneHandler.attackZoneContextMenu}
      />
    </div>
  );
});
