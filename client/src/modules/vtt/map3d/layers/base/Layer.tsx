import React from 'react';

export interface LayerProps {
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
}

// This remains a lightweight functional abstract/interface for now.
// Real rendering logic is specific to Map, Grid, or Fog.
export const BaseLayer: React.FC<React.PropsWithChildren<LayerProps>> = ({
  children,
  visible = true,
  zIndex = 0
}) => {
  if (!visible) return null;
  return (
    <group position={[0, 0, zIndex]}>
      {children}
    </group>
  );
};
