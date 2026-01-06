import React, { useEffect } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useTokenStore } from '../../store/tokenStore';
import { MapScene, Viewport, GridOptions } from '../../types/map.types';
import { Token } from '../../types/token.types';

interface MapStoreInitializerProps {
  scene?: MapScene;
  tokens: Token[];
  viewport: Viewport;
  grid: GridOptions;
}

export const MapStoreInitializer: React.FC<MapStoreInitializerProps> = ({
  scene,
  tokens,
  viewport,
  grid
}) => {
  const { setMapData, updateViewport } = useMapStore();
  const { setTokens } = useTokenStore();

  // Sync props to store
  useEffect(() => {
    if (scene || grid) {
      setMapData({
        imageUrl: scene?.imageUrl,
        grid: grid,
        width: (grid.cols || 50) * (grid.size || 60),
        height: (grid.rows || 50) * (grid.size || 60),
      });
    }
  }, [scene, grid, setMapData]);

  useEffect(() => {
    setTokens(tokens);
  }, [tokens, setTokens]);

  useEffect(() => {
    // Sync initial viewport or remote updates
    // Careful not to loop if viewport changes come from store -> parent -> store
    // ideally we only set initial or if "remote" flag is true.
    // For now, we trust the parent passes the authoritative viewport.
    updateViewport(viewport);
  }, [viewport, updateViewport]);

  return null;
};
