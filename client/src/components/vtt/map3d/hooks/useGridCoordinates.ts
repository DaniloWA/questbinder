import { useCallback } from 'react';

interface GridProps {
  width: number;
  height: number;
}

export const useGridCoordinates = (width: number, height: number) => {
  // VTT 2D: (0,0) Top-Left -> (W, H) Bottom-Right
  // Three 3D: (0,0) Center -> (-W/2, H/2) Top-Left, (W/2, -H/2) Bottom-Right (assuming XY plane)

  const to3D = useCallback((x: number, y: number) => {
    // x: 0 -> -width/2
    // x: width -> width/2
    const x3d = x - width / 2;

    // y: 0 -> height/2
    // y: height -> -height/2
    const y3d = height / 2 - y;

    // z is 0 (or slightly lifted for tokens)
    return [x3d, y3d, 0.1] as [number, number, number];
  }, [width, height]);

  const to2D = useCallback((x3d: number, y3d: number) => {
    const x = x3d + width / 2;
    const y = height / 2 - y3d;
    return [x, y] as [number, number];
  }, [width, height]);

  return { to3D, to2D };
};
