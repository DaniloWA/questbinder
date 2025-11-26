// utils/__tests__/attackZoneCalculator.test.ts

import { calculateAttackZone, worldToGrid, gridToWorld } from '../attackZoneCalculator';
import { AttackZoneConfig } from '../../types/attackZone';
import { Token, Obstacle, GridOptions } from '../../types/models';

describe('attackZoneCalculator', () => {
  const defaultGrid: GridOptions = {
    size: 60,
    color: '#ffffff',
    alpha: 0.3,
    cols: 50,
    rows: 50,
    unitsPerSquare: 5,
  };

  const createToken = (id: string, x: number, y: number, disposition: 'friendly' | 'hostile' = 'friendly'): Token => ({
    id,
    type: 'pc',
    name: `Token ${id}`,
    x,
    y,
    size: 1,
    imgUrl: '',
    isVisibleToPlayers: true,
    disposition,
  });

  const createWallObstacle = (points: { x: number; y: number; }[]): Obstacle => ({
    id: 'wall-1',
    type: 'wall',
    blocksVision: true,
    blocksMovement: true,
    points,
  });

  describe('Circle Zone', () => {
    it('should calculate circular zone without obstacles', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Fireball',
        shape: 'circle',
        radius: 3,
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: false,
        targeting: 'all',
        color: 'rgba(255, 0, 0, 0.3)',
        opacity: 0.3,
      };

      const tokens: Token[] = [
        createToken('1', 250, 250), // Dentro
        createToken('2', 500, 500), // Fora
      ];

      const result = calculateAttackZone(config, [], tokens, defaultGrid);

      expect(result.affectedArea.length).toBeGreaterThan(0);
      expect(result.affectedTokens.length).toBe(1);
      expect(result.affectedTokens[0].id).toBe('1');
      expect(result.blockedTokens.length).toBe(0);
    });

    it('should respect obstacles with blocked propagation', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Fireball',
        shape: 'circle',
        radius: 3,
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: true,
        targeting: 'all',
        color: 'rgba(255, 0, 0, 0.3)',
        opacity: 0.3,
      };

      const wall = createWallObstacle([
        { x: 320, y: 250 },
        { x: 320, y: 350 },
        { x: 330, y: 350 },
        { x: 330, y: 250 },
      ]);

      const tokens: Token[] = [
        createToken('1', 250, 300), // Antes da parede
        createToken('2', 350, 300), // Atrás da parede
      ];

      const result = calculateAttackZone(config, [wall], tokens, defaultGrid);

      expect(result.blockedTokens.length).toBeGreaterThan(0);
    });

    it('should penetrate obstacles with penetrating propagation', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Magic Missile',
        shape: 'circle',
        radius: 3,
        origin: { x: 300, y: 300 },
        propagation: 'penetrating',
        respectsVision: false,
        targeting: 'all',
        color: 'rgba(100, 100, 255, 0.3)',
        opacity: 0.3,
      };

      const wall = createWallObstacle([
        { x: 320, y: 250 },
        { x: 320, y: 350 },
        { x: 330, y: 350 },
        { x: 330, y: 250 },
      ]);

      const tokens: Token[] = [
        createToken('1', 250, 300),
        createToken('2', 350, 300),
      ];

      const result = calculateAttackZone(config, [wall], tokens, defaultGrid);

      expect(result.affectedTokens.length).toBe(2);
      expect(result.blockedTokens.length).toBe(0);
    });
  });

  describe('Cone Zone', () => {
    it('should calculate cone zone', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Burning Hands',
        shape: 'cone',
        length: 3,
        width: 3,
        angle: 53,
        direction: 0, // Apontando para direita
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: true,
        targeting: 'all',
        color: 'rgba(255, 100, 0, 0.3)',
        opacity: 0.3,
      };

      const tokens: Token[] = [
        createToken('1', 350, 300), // Na frente
        createToken('2', 250, 300), // Atrás
      ];

      const result = calculateAttackZone(config, [], tokens, defaultGrid);

      expect(result.affectedTokens.length).toBe(1);
      expect(result.affectedTokens[0].id).toBe('1');
    });
  });

  describe('Line Zone', () => {
    it('should calculate line zone', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Lightning Bolt',
        shape: 'line',
        length: 10,
        width: 1,
        direction: 0,
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: true,
        targeting: 'all',
        color: 'rgba(100, 100, 255, 0.3)',
        opacity: 0.3,
      };

      const tokens: Token[] = [
        createToken('1', 400, 300), // Na linha
        createToken('2', 400, 400), // Fora da linha
      ];

      const result = calculateAttackZone(config, [], tokens, defaultGrid);

      expect(result.affectedTokens.length).toBe(1);
      expect(result.affectedTokens[0].id).toBe('1');
    });
  });

  describe('Targeting', () => {
    it('should target only enemies', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Fireball',
        shape: 'circle',
        radius: 5,
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: false,
        targeting: 'enemies',
        color: 'rgba(255, 0, 0, 0.3)',
        opacity: 0.3,
      };

      const tokens: Token[] = [
        createToken('1', 280, 280, 'friendly'),
        createToken('2', 320, 280, 'hostile'),
        createToken('3', 280, 320, 'hostile'),
      ];

      const result = calculateAttackZone(config, [], tokens, defaultGrid);

      expect(result.validTargets.length).toBe(2);
      expect(result.validTargets.every(t => t.disposition === 'hostile')).toBe(true);
    });

    it('should target only allies', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Healing Word',
        shape: 'circle',
        radius: 3,
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: false,
        targeting: 'allies',
        color: 'rgba(0, 255, 0, 0.3)',
        opacity: 0.3,
      };

      const tokens: Token[] = [
        createToken('1', 280, 280, 'friendly'),
        createToken('2', 320, 280, 'hostile'),
        createToken('3', 280, 320, 'friendly'),
      ];

      const result = calculateAttackZone(config, [], tokens, defaultGrid);

      expect(result.validTargets.length).toBe(2);
      expect(result.validTargets.every(t => t.disposition === 'friendly')).toBe(true);
    });

    it('should respect manual inclusion/exclusion', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Custom Zone',
        shape: 'circle',
        radius: 5,
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: false,
        targeting: 'custom',
        includeTokenIds: ['2'],
        excludeTokenIds: ['1'],
        color: 'rgba(255, 0, 0, 0.3)',
        opacity: 0.3,
      };

      const tokens: Token[] = [
        createToken('1', 280, 280), // Excluído manualmente
        createToken('2', 500, 500), // Incluído manualmente (fora da área)
        createToken('3', 320, 320), // Dentro da área
      ];

      const result = calculateAttackZone(config, [], tokens, defaultGrid);

      expect(result.validTargets.length).toBe(2);
      expect(result.validTargets.find(t => t.id === '1')).toBeUndefined();
      expect(result.validTargets.find(t => t.id === '2')).toBeDefined();
      expect(result.validTargets.find(t => t.id === '3')).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should calculate correct statistics', () => {
      const config: AttackZoneConfig = {
        id: 'zone-1',
        name: 'Fireball',
        shape: 'circle',
        radius: 3,
        origin: { x: 300, y: 300 },
        propagation: 'blocked',
        respectsVision: false,
        targeting: 'all',
        color: 'rgba(255, 0, 0, 0.3)',
        opacity: 0.3,
      };

      const tokens: Token[] = [
        createToken('1', 280, 280),
        createToken('2', 320, 280),
        createToken('3', 280, 320),
      ];

      const result = calculateAttackZone(config, [], tokens, defaultGrid);

      expect(result.stats.tokenCount).toBe(3);
      expect(result.stats.blockedCount).toBe(0);
      expect(result.stats.totalArea).toBeGreaterThan(0);
      expect(result.stats.coveragePercent).toBeGreaterThan(0);
    });
  });

  describe('Grid Conversion', () => {
    it('should convert world to grid coordinates', () => {
      const world = { x: 180, y: 240 };
      const grid = worldToGrid(world, defaultGrid);

      expect(grid.x).toBe(3);
      expect(grid.y).toBe(4);
    });

    it('should convert grid to world coordinates (center)', () => {
      const grid = { x: 3, y: 4 };
      const world = gridToWorld(grid, defaultGrid);

      expect(world.x).toBe(210); // 3 * 60 + 30
      expect(world.y).toBe(270); // 4 * 60 + 30
    });
  });
});
