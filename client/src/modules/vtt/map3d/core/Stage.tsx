import React from 'react';
import { CameraRig } from './camera/CameraRig';
import { SceneLighting } from './lighting/SceneLighting';
import { MapLayer } from '../layers/map/MapLayer';
import { GridLayer } from '../layers/grid/GridLayer';
import { EffectLayer } from '../layers/effects/EffectLayer';
import { TokenManager } from '../entities/tokens/TokenManager';
// Entities will be imported here in Phase 4

import { RaycastManager } from '../interaction/raycasting/RaycastManager';
import { GestureHandler } from '../interaction/gestures/GestureHandler';

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
        {/* <InteractionManager /> */}
      </group>
    </>
  );
};
