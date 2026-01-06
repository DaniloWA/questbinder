import React, { Suspense } from 'react';
import { EffectComposer, Bloom, Outline, Selection } from '@react-three/postprocessing';
import { BlendFunction, Resizer, KernelSize } from 'postprocessing';
import { useSelectionStore } from '../../store/selectionStore';

// We wrap the entire scene content that needs outline inside <Selection>
// But typically PostProcessing effects are rendered effectively as a separate pass.
// For Outline to work on specific objects, those objects need to be wrapped in <Select enabled>
// inside the scene. 

// HOWEVER, the standard way to do this globally is to have the EffectLayer simply provide the
// Composer. The individual entities (Tokens) will wrap themselves in <Select>.
// Or we pass the selected objects to the Outline effect if it supports it.
// The @react-three/postprocessing Outline supports <Select> components in the tree.

export const EffectLayer: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <EffectComposer multisampling={4} autoClear={false}>
        {/* Bloom for glowing tokens/magic */}
        <Bloom
          luminanceThreshold={1} // Only very bright things glow
          mipmapBlur
          intensity={0.5}
          radius={0.4}
        />

        {/* Outline for Selection - This relies on <Select> component wrapping meshes elsewhere */}
        <Outline
          blur
          edgeStrength={10}
          width={500}
          visibleEdgeColor={0xffffff}
          hiddenEdgeColor={0x22090a}
        />
      </EffectComposer>
    </Suspense>
  );
};
