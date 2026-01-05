import React, { createContext, useContext } from 'react';
import { useNotification } from './NotificationContext';
import { GameSessionContextType } from './gameSession/types';
import { useGameState } from './gameSession/hooks/useGameState';
import { useSocketListeners } from './gameSession/hooks/useSocketListeners';
import { useSceneActions } from './gameSession/hooks/useSceneActions';
import { useTokenActions } from './gameSession/hooks/useTokenActions';
import { useCombatActions } from './gameSession/hooks/useCombatActions';
import { useChatActions } from './gameSession/hooks/useChatActions';
import { useHandoutActions } from './gameSession/hooks/useHandoutActions';
import { useAudioActions } from './gameSession/hooks/useAudioActions';
import { useDrawingActions } from './gameSession/hooks/useDrawingActions';
import { usePermissions } from './gameSession/hooks/usePermissions';
import { useObstacleActions } from './gameSession/hooks/useObstacleActions';
import { useZoneActions } from './gameSession/hooks/useZoneActions';
import { useCharacterActions } from './gameSession/hooks/useCharacterActions';
import { useTemplateActions } from './gameSession/hooks/useTemplateActions';
import { useMapInteraction } from './gameSession/hooks/useMapInteraction';
import { useUiActions } from './gameSession/hooks/useUiActions';
import { useAuraSystem } from './gameSession/hooks/useAuraSystem';
import { useAttackZoneActions } from './gameSession/hooks/useAttackZoneActions';
import { audioService } from '../services/audioService';

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export const GameSessionProvider: React.FC<{ children: React.ReactNode, campaignId: string; }> = ({ children, campaignId }) => {
    const { show } = useNotification();
    const {
        state, setState, isCompendiumOpen, setIsCompendiumOpen,
        activeScene, activeHandout, sharedHandout, user
    } = useGameState(campaignId);

    const { checkPermission, updatePermissions, permissionHelper } = usePermissions(state, setState, user);
    const { setViewport, addPing, setRulerSettings, pullView, toggleFollowMode } = useMapInteraction(state, setState, user, permissionHelper);

    const setPullNotification = (show: boolean) => setState(prev => ({ ...prev, pullNotification: show }));

    const {
        moveToken, moveTokens, updateToken, addToken, removeToken,
        moveTokenToScene, selectToken, clearSelection, emitTokenDrag, emitCursorMove
    } = useTokenActions(state, setState, campaignId, user, show, permissionHelper);

    const {
        sendChatMessage, toggleChatReaction, handleChatLinkClick, rollDice, broadcastRoll
    } = useChatActions(state, setState, campaignId, user, show, setIsCompendiumOpen, setViewport, addPing, selectToken, permissionHelper);

    // Create a ref for state to be used in listeners without closure staleness
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useSocketListeners(state, setState, campaignId, user, show, setViewport, stateRef);
    useAuraSystem(state, updateToken, campaignId, state.isGM);

    // Audio Zone Playback Effect
    React.useEffect(() => {
        if (state.activeAudioZoneUrl) {
            // Find the zone to get its volume setting
            const activeZone = state.scenes
                .find(s => s.id === state.activeSceneId)
                ?.audioZones?.find(z => z.audioUrl === state.activeAudioZoneUrl);

            const zoneVolume = activeZone?.volume ?? 0.3; // Default to 30% if not found

            console.log('[AudioZone] Entering zone, playing:', state.activeAudioZoneUrl, 'volume:', zoneVolume);
            audioService.playMusic(state.activeAudioZoneUrl, true, zoneVolume);
        } else {
            // console.log('[AudioZone] Exiting zone, stopping music');
            audioService.stopMusic();
        }
    }, [state.activeAudioZoneUrl, state.scenes, state.activeSceneId]);

    const {
        switchScene, addScene, deleteScene, updateSceneData, updateMapSettings, updateFog
    } = useSceneActions(state, setState, campaignId);

    const {
        startCombat, endCombat, nextTurn, previousTurn, goToTurn,
        addCombatant, removeCombatant, updateCombatant, rerollInitiative, updateCombatSettings,
        applyDamage, applyHealing, applyEffect, removeEffect,
        addCondition, removeCondition, toggleAction, resetActions,
        checkConcentration, getCombatStats, exportCombatLog
    } = useCombatActions(state, setState);

    const {
        createHandout, updateHandout, deleteHandout, shareHandout, unshareHandout
    } = useHandoutActions(state, setState, show);

    const {
        updateAudioSettings, addAudioZones, updateAudioZone, removeAudioZone
    } = useAudioActions(state, setState, campaignId, show);

    const {
        addDrawing, removeDrawing, undoLastDrawing, clearAllDrawings, setDrawingSettings
    } = useDrawingActions(state, setState, campaignId, user, permissionHelper);

    const {
        addObstacles, updateObstacle, removeObstacle, bulkUpdateObstacles
    } = useObstacleActions(state, setState, campaignId);

    const {
        addLightZones, addLightToken, addTriggerZones, updateTriggerZone, removeTriggerZone, closeTriggeredHandout
    } = useZoneActions(state, setState, campaignId, addToken);

    const { updateCharacter, toggleFieldPrivacy } = useCharacterActions(state, setState, user, permissionHelper, (message, type) => show({ message, type }));
    const { saveTemplate, deleteTemplate } = useTemplateActions(state, setState, show);

    const {
        addAttackZone, updateAttackZone, removeAttackZone, clearAttackZones
    } = useAttackZoneActions(state, setState);

    const uiActions = useUiActions(state, setState, campaignId, isCompendiumOpen, setIsCompendiumOpen);

    const value: GameSessionContextType = {
        ...state,
        user,
        activeScene,
        sharedHandout,
        activeHandout,
        moveToken,
        setViewport,
        switchScene,
        addScene,
        deleteScene,
        updateSceneData,
        moveTokens,
        updateToken,
        addToken,
        removeToken,
        moveTokenToScene,
        selectToken,
        clearSelection,
        addObstacles,
        updateObstacle,
        removeObstacle,
        bulkUpdateObstacles,
        updateFog,
        addPing,
        startCombat,
        endCombat,
        nextTurn,
        previousTurn,
        goToTurn,
        addCombatant,
        removeCombatant,
        updateCombatant,
        rerollInitiative,
        updateCombatSettings,
        applyDamage,
        applyHealing,
        applyEffect,
        removeEffect,
        addCondition,
        removeCondition,
        toggleAction,
        resetActions,
        checkConcentration,
        getCombatStats,
        exportCombatLog,
        pullView,
        sendChatMessage,
        toggleChatReaction,
        handleChatLinkClick,
        rollDice,
        broadcastRoll,
        updateCharacter,
        toggleFieldPrivacy,
        createHandout,
        updateHandout,
        deleteHandout,
        shareHandout,
        unshareHandout,
        saveTemplate,
        deleteTemplate,
        updateAudioSettings,
        updateAudioZone,
        removeAudioZone,
        addLightToken,
        addLightZones,
        addAudioZones,
        addTriggerZones,
        updateTriggerZone,
        removeTriggerZone,
        closeTriggeredHandout,
        addDrawing,
        removeDrawing,
        undoLastDrawing,
        clearAllDrawings,
        setDrawingSettings,
        setRulerSettings,
        checkPermission,
        updatePermissions,
        permissionHelper, // Global permission helper
        updateMapSettings,
        emitTokenDrag,
        emitCursorMove,
        setPullNotification,
        toggleFollowMode,
        addAttackZone,
        updateAttackZone,
        removeAttackZone,
        clearAttackZones,
        ...uiActions
    };

    return (
        <GameSessionContext.Provider value={value}>
            {children}
        </GameSessionContext.Provider>
    );
};

export const useGameSession = (): GameSessionContextType => {
    const context = useContext(GameSessionContext);
    if (!context) {
        throw new Error('useGameSession must be used within a GameSessionProvider');
    }
    return context;
};

export type { GameSessionContextType, GameSessionState } from './gameSession/types';
