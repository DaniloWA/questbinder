import React from 'react';
import { CameraRig } from './camera/CameraRig';
import { SceneLighting } from './lighting/SceneLighting';
import { MapLayer } from '../layers/map/MapLayer';
import { GridLayer } from '../layers/grid/GridLayer';
import { EffectLayer } from '../layers/effects/EffectLayer';
import { TokenManager } from '../entities/tokens/TokenManager';
import { RaycastManager } from '../interaction/raycasting/RaycastManager';
import { GestureHandler } from '../interaction/gestures/GestureHandler';
import { WorldUiManager } from '../ui/world/WorldUiManager';

export const Stage: React.FC = () => {
  return (
    <>
      <CameraRig />
      <SceneLighting />
      <GestureHandler />
      <RaycastManager />

      <group name="Layers">
        <MapLayer />
        <GridLayer />
        {/* <EffectLayer /> */}
      </group>

      <group name="Entities">
        <TokenManager />
      </group>

      <group name="UI-World">
        <WorldUiManager />
      </group>
    </>
  );
};
