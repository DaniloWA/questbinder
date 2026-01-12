import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/TranslationContext';
import { useAccessControl } from '../../hooks/useAccessControl';
import { Handout } from '../../types';
import { useGameSession } from '../../context/GameSessionContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Share2, EyeOff, Check, User } from 'lucide-react';

interface HandoutShareModalProps {
  handout: Handout | null;
  onClose: () => void;
}

export const HandoutShareModal: React.FC<HandoutShareModalProps> = ({ handout, onClose }) => {
  const { t } = useTranslation();
  // FIX: Get `campaign` from context to access `ownerId`.
  const { players, shareHandout, campaign } = useGameSession();
  const { isGM } = useAccessControl();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    if (handout) {
      setSelectedPlayerIds(handout.sharedWith);
    }
  }, [handout]);

  if (!handout || !isGM) return null;

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    // FIX: This call now matches the updated context function signature.
    await shareHandout(handout.id, selectedPlayerIds);
    setIsSharing(false);
    onClose();
  };

  const handleUnshare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    // FIX: "Unsharing" is achieved by sharing with an empty list of players.
    await shareHandout(handout.id, []);
    setIsSharing(false);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedPlayerIds(players.map(p => p.id));
  };

  // FIX: A handout does not have an ownerId; the campaign does. Use campaign.ownerId to identify the GM.
  const gmId = campaign?.ownerId;
  const actualPlayers = players.filter(p => p.id !== gmId);

  return (
    <Modal isOpen={!!handout} onClose={onClose} title={`Compartilhar: ${handout.name}`} size="md">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-3">{t('vtt.handouts.shareModal.selectPlayers.title')}</h3>
          <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-2 -mr-2 bg-muted/20 p-2 rounded-lg border border-border">
            {actualPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center p-4">{t('vtt.handouts.shareModal.noPlayers.text')}</p>
            ) : (
              actualPlayers.map(player => (
                <div
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlayerIds.includes(player.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-accent'}`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${selectedPlayerIds.includes(player.id) ? 'bg-primary border-primary' : 'bg-transparent border-input'}`}>
                    {selectedPlayerIds.includes(player.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <img src={player.avatarUrl} alt={player.name} className="w-8 h-8 rounded-full" />
                  <span className="font-bold text-foreground">{player.name}</span>
                </div>
              ))
            )}
          </div>
          {actualPlayers.length > 0 && <Button variant="link" size="sm" onClick={handleSelectAll} className="mt-2">{t('vtt.handouts.shareModal.selectAll.button')}</Button>}
        </div>

        <div className="flex justify-between items-center gap-3 pt-4 border-t border-border">
          <Button variant="destructive" onClick={handleUnshare} disabled={isSharing}>
            <EyeOff className="w-4 h-4 mr-2" /> {t('vtt.handouts.shareModal.hideFromAll.button')}
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSharing}>{t('common.actions.cancel.label')}</Button>
            <Button onClick={handleShare} disabled={isSharing}>
              <Share2 className="w-4 h-4 mr-2" /> {isSharing ? t('vtt.handouts.shareModal.sharing.text') : t('vtt.handouts.shareModal.saveSharing.button')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
