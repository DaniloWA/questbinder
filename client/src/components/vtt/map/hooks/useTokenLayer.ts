import { useState, useRef, useEffect } from 'react';
import { DragState } from '../types';
import { Token } from '../../../../types';

export interface TokenAnimation {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  duration: number;
}

export const useTokenLayer = (tokens: Token[], dragState: React.MutableRefObject<DragState>) => {
  const [animatingTokens, setAnimatingTokens] = useState<Map<string, TokenAnimation>>(new Map());
  const animationsRef = useRef<Map<string, TokenAnimation>>(new Map());
  const prevTokensRef = useRef<Token[]>(tokens);

  useEffect(() => {
    animationsRef.current = animatingTokens;
  }, [animatingTokens]);

  useEffect(() => {
    const newAnimations = new Map(animationsRef.current);
    let changed = false;
    tokens.forEach(token => {
      const prevToken = prevTokensRef.current.find(t => t.id === token.id);
      if (prevToken && (token.x !== prevToken.x || token.y !== prevToken.y)) {
        if (dragState.current.isDragging && dragState.current.token?.id === token.id) return;
        const dist = Math.hypot(token.x - prevToken.x, token.y - prevToken.y);
        if (dist > 0.1) {
          newAnimations.delete(token.id);
          const duration = Math.min(500, 150 + dist * 30);
          newAnimations.set(token.id, {
            id: token.id,
            startX: prevToken.x,
            startY: prevToken.y,
            targetX: token.x,
            targetY: token.y,
            startTime: Date.now(),
            duration
          });
          changed = true;
        }
      }
    });
    if (changed) setAnimatingTokens(newAnimations);
    prevTokensRef.current = tokens;
  }, [tokens, dragState]); // Added dragState to dependency array, though it's a ref, the effect runs on tokens change

  return {
    animatingTokens,
    setAnimatingTokens,
    animationsRef
  };
};
