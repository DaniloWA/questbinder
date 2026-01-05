// context/gameSession/hooks/useAttackZones.ts

import { useState, useCallback, useMemo } from 'react';
import { Token, Obstacle, GridOptions } from '../../../types/models';
import {
  AttackZoneConfig,
  AttackZoneResult,
  AttackZoneTemplate,
  ATTACK_ZONE_PRESETS
} from '../../../types/attackZone';
import { calculateAttackZone } from '../../../utils/attackZoneCalculator';

interface UseAttackZonesOptions {
  tokens: Token[];
  obstacles: Obstacle[];
  grid: GridOptions;
  // Synced zones from context
  activeZones: AttackZoneConfig[];
  // Callbacks for synced operations (via WebSocket)
  onAddZone: (zone: AttackZoneConfig) => void;
  onRemoveZone: (zoneId: string) => void;
  onUpdateZone: (zoneId: string, updates: Partial<AttackZoneConfig>) => void;
  onClearZones: () => void;
}

/**
 * Hook para gerenciar zonas de ataque com sincronização via WebSocket
 * Recebe as zonas ativas do contexto global e callbacks para modificá-las
 */
export const useAttackZones = ({
  tokens,
  obstacles,
  grid,
  activeZones,
  onAddZone,
  onRemoveZone,
  onUpdateZone,
  onClearZones
}: UseAttackZonesOptions) => {
  // Preview state is local only (not synced)
  const [previewZone, setPreviewZone] = useState<AttackZoneConfig | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AttackZoneTemplate | null>(null);
  // Placement mode - preview follows mouse until click to place
  const [isPlacingZone, setIsPlacingZone] = useState(false);

  /**
   * Calcula resultado de uma zona específica
   */
  const calculateZone = useCallback((config: AttackZoneConfig): AttackZoneResult => {
    return calculateAttackZone(config, obstacles, tokens, grid);
  }, [obstacles, tokens, grid]);

  /**
   * Resultados calculados de todas as zonas ativas
   */
  const activeZoneResults = useMemo(() => {
    return activeZones.map(zone => calculateZone(zone));
  }, [activeZones, calculateZone]);

  /**
   * Resultado da zona de preview
   */
  const previewZoneResult = useMemo(() => {
    return previewZone ? calculateZone(previewZone) : null;
  }, [previewZone, calculateZone]);

  /**
   * Adiciona uma nova zona ativa (via WebSocket)
   */
  const addZone = useCallback((config: AttackZoneConfig) => {
    onAddZone(config);
  }, [onAddZone]);

  /**
   * Remove uma zona ativa (via WebSocket)
   */
  const removeZone = useCallback((zoneId: string) => {
    onRemoveZone(zoneId);
  }, [onRemoveZone]);

  /**
   * Atualiza uma zona existente (via WebSocket)
   */
  const updateZone = useCallback((zoneId: string, updates: Partial<AttackZoneConfig>) => {
    onUpdateZone(zoneId, updates);
  }, [onUpdateZone]);

  /**
   * Limpa todas as zonas ativas (via WebSocket)
   */
  const clearZones = useCallback(() => {
    onClearZones();
  }, [onClearZones]);

  /**
   * Cria zona a partir de um template
   */
  const createFromTemplate = useCallback((
    template: AttackZoneTemplate,
    origin: { x: number; y: number; },
    overrides?: Partial<AttackZoneConfig>
  ): AttackZoneConfig => {
    const id = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      name: template.name,
      description: template.description,
      shape: 'circle',
      radius: 0,
      propagation: 'blocked',
      respectsVision: true,
      targeting: 'all',
      color: 'rgba(255, 0, 0, 0.3)',
      opacity: 0.3,
      ...template.defaultConfig,
      origin,
      ...overrides,
    } as AttackZoneConfig;
  }, []);

  /**
   * Inicia preview de zona a partir de template (modo placement)
   */
  const startPreviewFromTemplate = useCallback((
    templateId: string,
    origin: { x: number; y: number; }
  ) => {
    const template = ATTACK_ZONE_PRESETS.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(template);
    const zone = createFromTemplate(template, origin);
    setPreviewZone(zone);
    setIsPlacingZone(true); // Enter placement mode - preview follows mouse
  }, [createFromTemplate]);

  /**
   * Atualiza zona de preview
   */
  const updatePreview = useCallback((updates: Partial<AttackZoneConfig>) => {
    setPreviewZone(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  /**
   * Confirma zona de preview (adiciona às zonas ativas via WebSocket)
   */
  const confirmPreview = useCallback(() => {
    if (previewZone) {
      addZone(previewZone);
      setPreviewZone(null);
      setSelectedTemplate(null);
      setIsPlacingZone(false); // Exit placement mode
    }
  }, [previewZone, addZone]);

  /**
   * Cancela zona de preview
   */
  const cancelPreview = useCallback(() => {
    setPreviewZone(null);
    setSelectedTemplate(null);
    setIsPlacingZone(false); // Exit placement mode
  }, []);

  /**
   * Obtém todos os tokens afetados por todas as zonas ativas
   */
  const getAllAffectedTokens = useCallback((): Token[] => {
    const tokenSet = new Set<string>();
    const result: Token[] = [];

    for (const zoneResult of activeZoneResults) {
      for (const token of zoneResult.validTargets) {
        if (!tokenSet.has(token.id)) {
          tokenSet.add(token.id);
          result.push(token);
        }
      }
    }

    return result;
  }, [activeZoneResults]);

  /**
   * Verifica se um token específico está em alguma zona
   */
  const isTokenInZone = useCallback((tokenId: string, zoneId?: string): boolean => {
    if (zoneId) {
      const zone = activeZoneResults.find(z => z.config.id === zoneId);
      return zone?.validTargets.some(t => t.id === tokenId) || false;
    }

    return activeZoneResults.some(zone =>
      zone.validTargets.some(t => t.id === tokenId)
    );
  }, [activeZoneResults]);

  /**
   * Obtém estatísticas agregadas de todas as zonas
   */
  const getAggregatedStats = useCallback(() => {
    const allTokens = getAllAffectedTokens();
    const totalArea = activeZoneResults.reduce((sum, z) => sum + z.stats.totalArea, 0);
    const totalBlocked = activeZoneResults.reduce((sum, z) => sum + z.stats.blockedCount, 0);

    return {
      totalZones: activeZones.length,
      totalTokensAffected: allTokens.length,
      totalArea,
      totalBlocked,
      averageCoverage: activeZoneResults.length > 0
        ? activeZoneResults.reduce((sum, z) => sum + z.stats.coveragePercent, 0) / activeZoneResults.length
        : 0,
    };
  }, [activeZones.length, activeZoneResults, getAllAffectedTokens]);

  /**
   * Cria zona customizada (sem template)
   */
  const createCustomZone = useCallback((
    config: Partial<AttackZoneConfig>
  ): AttackZoneConfig => {
    const id = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      name: config.name || 'Zona Customizada',
      shape: 'circle',
      radius: 3,
      origin: { x: 0, y: 0 },
      propagation: 'blocked',
      respectsVision: true,
      targeting: 'all',
      color: 'rgba(255, 0, 0, 0.3)',
      opacity: 0.3,
      ...config,
    } as AttackZoneConfig;
  }, []);

  /**
   * Duplica uma zona existente (via WebSocket)
   */
  const duplicateZone = useCallback((zoneId: string, newOrigin?: { x: number; y: number; }) => {
    const zone = activeZones.find(z => z.id === zoneId);
    if (!zone) return;

    const newZone = {
      ...zone,
      id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      origin: newOrigin || zone.origin,
    };

    addZone(newZone);
  }, [activeZones, addZone]);

  /**
   * Rotaciona uma zona (para cones e linhas) via WebSocket
   */
  const rotateZone = useCallback((zoneId: string, angle: number) => {
    updateZone(zoneId, { direction: angle });
  }, [updateZone]);

  /**
   * Move uma zona para nova origem (via WebSocket)
   */
  const moveZone = useCallback((zoneId: string, newOrigin: { x: number; y: number; }) => {
    updateZone(zoneId, { origin: newOrigin });
  }, [updateZone]);

  /**
   * Obtém templates disponíveis
   */
  const getAvailableTemplates = useCallback(() => {
    return ATTACK_ZONE_PRESETS;
  }, []);

  /**
   * Filtra templates por categoria
   */
  const getTemplatesByCategory = useCallback((category: string) => {
    return ATTACK_ZONE_PRESETS.filter(t => t.category === category);
  }, []);

  return {
    // Estado
    activeZones,
    previewZone,
    selectedTemplate,
    activeZoneResults,
    previewZoneResult,
    isPlacingZone, // True when mouse-follow placement mode is active

    // Ações básicas (sync via WebSocket)
    addZone,
    removeZone,
    updateZone,
    clearZones,

    // Preview / Placement (local only)
    startPreviewFromTemplate,
    updatePreview,
    confirmPreview,
    cancelPreview,

    // Templates
    createFromTemplate,
    createCustomZone,
    getAvailableTemplates,
    getTemplatesByCategory,

    // Manipulação (sync via WebSocket)
    duplicateZone,
    rotateZone,
    moveZone,

    // Consultas
    getAllAffectedTokens,
    isTokenInZone,
    getAggregatedStats,
    calculateZone,
  };
};
