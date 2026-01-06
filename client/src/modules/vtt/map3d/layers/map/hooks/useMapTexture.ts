import { useLoader } from '@react-three/fiber';
import { TextureLoader, LinearFilter, NearestFilter } from 'three';
import { useMapStore } from '../../../store/mapStore';

export const useMapTexture = () => {
  const imageUrl = useMapStore(state => state.mapData.imageUrl);

  // Conditionally load texture if URL is present. Return null if none.
  const texture = imageUrl ? useLoader(TextureLoader, imageUrl) : null;

  if (texture) {
    // Optimization: Adjust filters based on requirements (Pixel Art vs High Res)
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = true; // Use mipmaps for better quality at zoom
  }

  return texture;
};
