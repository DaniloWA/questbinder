import React from 'react';
import { useGameSession } from '@/context/GameSessionContext';
import { Ping3D } from './Ping3D';
import { RemoteCursor3D } from './RemoteCursor3D';

export const WorldUiManager: React.FC = () => {
  const { pings, remoteCursors } = useGameSession();

  return (
    <group name="WorldUI">
      {/* Pings */}
      {pings.map(ping => (
        <Ping3D key={ping.id} ping={ping} />
      ))}

      {/* Remote Cursors - CursorMovePayload already has userName/userColor */}
      {Object.entries(remoteCursors).map(([oderId, cursor]) => (
        <RemoteCursor3D key={oderId} cursor={cursor} />
      ))}
    </group>
  );
};
