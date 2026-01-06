import React from 'react';
import { useGesture } from '@use-gesture/react';
import { useMapStore } from '../../store/mapStore';
import { useThree } from '@react-three/fiber';
import { ZOOM_MAX, ZOOM_MIN } from '../../shared/constants/map.constants';

export const GestureHandler: React.FC = () => {
  const { gl } = useThree();
  const { viewport, updateViewport } = useMapStore();

  const bind = useGesture({
    onDrag: ({ offset: [x, y], event }) => {
      // event.preventDefault() might be needed on DOM element
      // MapControls typically handles this logic internally for pan.
      // But if we want custom logic (e.g. mobile touch pan), we do it here.

      // For now, let's allow MapControls to handle standard Panning via "onChange" hook we made in CameraRig.
      // This handler is reserved for gestures MapControls doesn't support well, like Pinch-to-Zoom on mobile
      // or specific multi-touch logic.
    },
    onPinch: ({ offset: [d], event }) => {
      // Handle Zoom
      // d is scale factor
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, d));
      if (newZoom !== viewport.zoom) {
        updateViewport({ zoom: newZoom });
      }
    },
    onWheel: ({ offset: [dy, dx], event }) => {
      // Optional: Custom wheel handling if MapControls is disabled
    }
  }, {
    target: gl.domElement, // Bind to the canvas DOM element
    eventOptions: { passive: false },
    pinch: { scaleBounds: { min: ZOOM_MIN, max: ZOOM_MAX }, rubberband: true },
  });

  return null; // This component is logic-only, attached to canvas via gl.domElement
};
