import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import * as THREE from 'three';

// Patch BufferGeometry to have BVH methods
// This needs to happen once globally, ideally in an index or init file.
// But placing here ensures it's run when interaction system is used.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export const RaycastManager: React.FC = () => {
  const { raycaster } = useThree();

  useEffect(() => {
    // Configure raycaster for BVH
    // firstHitOnly is much faster for simple picking
    raycaster.firstHitOnly = true;

    return () => {
      raycaster.firstHitOnly = false;
    };
  }, [raycaster]);

  return null; // This component handles logic/setup only
};
