import React from 'react';
import { useTokenStore } from '../../store/tokenStore';
import { Token3D } from './Token3D';

export const TokenManager: React.FC = () => {
  const tokens = useTokenStore(state => state.tokens);

  const tokenList = Object.values(tokens);

  // Ensure unique tokens by ID to prevent duplicate key errors
  const uniqueTokens = React.useMemo(() => {
    const seen = new Set();
    return tokenList.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [tokenList]);

  return (
    <group name="TokenManager">
      {uniqueTokens.map(token => (
        <Token3D key={token.id} token={token} />
      ))}
    </group>
  );
};
