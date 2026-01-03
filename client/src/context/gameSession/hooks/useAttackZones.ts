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

/**
 * Hook para gerenciar zonas de ataque
 */
export const useAttackZones = (
  tokens: Token[],
  obstacles: Obstacle[],
  grid: GridOptions
) => {
  const [activeZones, setActiveZones] = useState<AttackZoneConfig[]>([]);
  const [previewZone, setPreviewZone] = useState<AttackZoneConfig | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AttackZoneTemplate | null>(null);

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
   * Adiciona uma nova zona ativa
   */
  const addZone = useCallback((config: AttackZoneConfig) => {
    setActiveZones(prev => [...prev, config]);
  }, []);

  /**
   * Remove uma zona ativa
   */
  const removeZone = useCallback((zoneId: string) => {
    setActiveZones(prev => prev.filter(z => z.id !== zoneId));
  }, []);

  /**
   * Atualiza uma zona existente
   */
  const updateZone = useCallback((zoneId: string, updates: Partial<AttackZoneConfig>) => {
    setActiveZones(prev => prev.map(z =>
      z.id === zoneId ? { ...z, ...updates } : z
    ));
  }, []);

  /**
   * Limpa todas as zonas ativas
   */
  const clearZones = useCallback(() => {
    setActiveZones([]);
  }, []);

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
   * Inicia preview de zona a partir de template
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
  }, [createFromTemplate]);

  /**
   * Atualiza zona de preview
   */
  const updatePreview = useCallback((updates: Partial<AttackZoneConfig>) => {
    setPreviewZone(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  /**
   * Confirma zona de preview (adiciona às zonas ativas)
   */
  const confirmPreview = useCallback(() => {
    if (previewZone) {
      addZone(previewZone);
      setPreviewZone(null);
      setSelectedTemplate(null);
    }
  }, [previewZone, addZone]);

  /**
   * Cancela zona de preview
   */
  const cancelPreview = useCallback(() => {
    setPreviewZone(null);
    setSelectedTemplate(null);
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
   * Duplica uma zona existente
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
   * Rotaciona uma zona (para cones e linhas)
   */
  const rotateZone = useCallback((zoneId: string, angle: number) => {
    updateZone(zoneId, { direction: angle });
  }, [updateZone]);

  /**
   * Move uma zona para nova origem
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

    // Ações básicas
    addZone,
    removeZone,
    updateZone,
    clearZones,

    // Preview
    startPreviewFromTemplate,
    updatePreview,
    confirmPreview,
    cancelPreview,

    // Templates
    createFromTemplate,
    createCustomZone,
    getAvailableTemplates,
    getTemplatesByCategory,

    // Manipulação
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
