import { useRef, useEffect } from 'react';

/**
 * useLatestRef - Returns a ref that always contains the latest value.
 * 
 * This hook solves the "stale closure" problem in React callbacks.
 * When you use useCallback, the function captures variables from its closure
 * at the time of creation. If those variables change, the callback still
 * references the old values.
 * 
 * By using useLatestRef, you can always access the current value via ref.current,
 * even inside memoized callbacks.
 * 
 * @example
 * ```typescript
 * const stateRef = useLatestRef(state);
 * 
 * const handleClick = useCallback(() => {
 *   // Instead of using `state` directly (which could be stale),
 *   // use stateRef.current to always get the latest value
 *   const currentState = stateRef.current;
 *   console.log(currentState.value);
 * }, []); // Empty deps array is safe now!
 * ```
 * 
 * @param value - The value to keep up-to-date in the ref
 * @returns A ref object where .current always contains the latest value
 */
export function useLatestRef<T>(value: T): React.RefObject<T> {
  const ref = useRef<T>(value);

  // Update the ref on every render
  // Using useEffect would cause a delayed update, so we update synchronously
  ref.current = value;

  return ref;
}

/**
 * useLatestCallback - Creates a stable callback that always calls the latest version.
 * 
 * This is useful when you need to pass a callback to a child component or 
 * event handler that should always execute the most recent logic.
 * 
 * @example
 * ```typescript
 * const handleSubmit = useLatestCallback((data: FormData) => {
 *   // This always has access to the latest state/props
 *   submitForm(state.user, data);
 * });
 * ```
 * 
 * @param callback - The callback function
 * @returns A stable function reference that calls the latest callback
 */
export function useLatestCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useLatestRef(callback);

  // Return a stable function that calls the latest callback
  // This function reference never changes, but always calls the current callback
  const stableCallback = useRef<T>(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T
  );

  return stableCallback.current;
}

/**
 * useStateRef - Specialized version for GameSessionState.
 * 
 * Provides convenient accessors for common state patterns.
 * 
 * @example
 * ```typescript
 * const { getState, getActiveScene, findToken } = useStateRef(state);
 * 
 * const handleMove = useCallback((tokenId, x, y) => {
 *   const token = findToken(tokenId);
 *   if (token) moveToken(token, x, y);
 * }, []);
 * ```
 */
export function useStateRef<TState extends {
  scenes: Array<{ id: string; tokens: Array<{ id: string; }>; }>;
  activeSceneId: string;
}>(state: TState) {
  const stateRef = useLatestRef(state);

  return {
    /** Get the current state */
    getState: () => stateRef.current,

    /** Get the active scene */
    getActiveScene: () => {
      const s = stateRef.current;
      return s.scenes.find(scene => scene.id === s.activeSceneId) || null;
    },

    /** Find a token by ID in the active scene */
    findToken: (tokenId: string) => {
      const s = stateRef.current;
      const scene = s.scenes.find(scene => scene.id === s.activeSceneId);
      return scene?.tokens.find(t => t.id === tokenId) || null;
    },

    /** Raw ref for advanced usage */
    ref: stateRef,
  };
}

export default useLatestRef;
