import { useState, useCallback } from 'react';
import { useGameSession } from '../../../context/GameSessionContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { useNotification } from '../../../context/NotificationContext';
import { Token, TokenTemplate, Condition } from '../../../types';
import { useTranslation } from '../../../i18n/TranslationContext';
import { TokenEditModal } from '../../../components/vtt/TokenEditModal';

interface UseTokenHandlerReturn {
  tokenContextMenu: { x: number; y: number; token: Token; } | null;
  viewingCharacterId: string | null;
  setViewingCharacterId: (id: string | null) => void;
  handleOpenTokenModal: (token: Token | 'new', initialPosition?: { x: number; y: number; }) => void;
  handleDuplicateToken: (token: Token) => void;
  handleUseTemplate: (tpl: TokenTemplate) => void;
  handleTokenContextMenu: (e: React.MouseEvent, tokenId: string) => void;
  handleToggleTokenCondition: (token: Token, condition: Condition) => void;
  handleOpenSheet: (token: Token) => void;
  closeTokenContextMenu: () => void;
}

export const useTokenHandler = (): UseTokenHandlerReturn => {
  const { t } = useTranslation();
  const session = useGameSession();
  const { isGM } = useAccessControl();
  const { user: currentUser } = useAuth();
  const { openModal, closeModal } = useModal();
  const { show } = useNotification();

  const [tokenContextMenu, setTokenContextMenu] = useState<{ x: number, y: number, token: Token; } | null>(null);
  const [viewingCharacterId, setViewingCharacterId] = useState<string | null>(null);

  const handleOpenTokenModal = useCallback((token: Token | 'new', initialPosition?: { x: number, y: number; }) => {
    if (!isGM) {
      if (token === 'new') {
        if (!session.permissionHelper.can('tokenCreate')) {
          show({ type: 'warning', message: t('vtt.gameSession.error.noTokenCreatePerm') });
          return;
        }
      } else {
        const isOwner = token.ownerId === currentUser?.id || token.controlledBy?.includes(currentUser?.id || '');
        if (!isOwner) {
          show({ type: 'warning', message: t('vtt.gameSession.error.notController') });
          return;
        }
        if (!session.permissionHelper.can('tokenEdit')) {
          show({ type: 'warning', message: t('vtt.gameSession.error.tokenEditBlocked') });
          return;
        }
      }
    }
    // Close context menus
    setTokenContextMenu(null);
    session.setCursorContextState(false);

    openModal(
      <TokenEditModal
        token={token}
        initialPosition={initialPosition}
        players={session.players}
        availableCharacters={session.campaignCharacters}
        sceneTokens={session.activeScene?.tokens || []}
        onSave={(data, pos) => {
          if (token === 'new') {
            session.addToken({ ...data, ...(pos || { x: 0, y: 0 }) });
          } else {
            session.updateToken(token.id, data);
          }
          closeModal();
        }}
        onSaveTemplate={session.saveTemplate}
        onCancel={closeModal}
        isGM={isGM}
      />,
      { title: token === 'new' ? t('vtt.gameSession.modal.token.create') : t('vtt.gameSession.modal.token.edit'), size: 'xl' }
    );
  }, [isGM, session, currentUser, show, t, openModal, closeModal]);

  const handleDuplicateToken = useCallback((token: Token) => {
    if (!isGM && !session.permissionHelper.can('tokenCreate')) {
      show({ type: 'warning', message: t('vtt.gameSession.error.tokenCreateBlocked') });
      return;
    }
    let offset = 1;
    const newToken = { ...token, id: undefined, name: `${token.name} (Clone)`, x: token.x + offset, y: token.y + offset };
    session.addToken(newToken);
  }, [isGM, session, show, t]);

  const handleUseTemplate = useCallback((tpl: TokenTemplate) => {
    if (!isGM && !session.permissionHelper.can('tokenCreate')) {
      show({ type: 'warning', message: t('vtt.gameSession.error.tokenCreateBlocked') });
      return;
    }
    if (!session.activeScene) return;
    const centerX = Math.floor((-session.viewport.x + (window.innerWidth / 2)) / session.viewport.zoom / session.activeScene.grid.size);
    const centerY = Math.floor((-session.viewport.y + (window.innerHeight / 2)) / session.viewport.zoom / session.activeScene.grid.size);
    session.setActiveTool('select');
  }, [isGM, session, show, t]);

  const handleTokenContextMenu = useCallback((e: React.MouseEvent, tokenId: string) => {
    if (!tokenId) { setTokenContextMenu(null); session.setCursorContextState(false); return; }
    const token = session.activeScene?.tokens.find(t => t.id === tokenId);

    if (token) {
      const isOwner = token.ownerId === currentUser?.id || token.controlledBy?.includes(currentUser?.id || '');
      if (isGM || isOwner) {
        setTokenContextMenu({ x: e.clientX, y: e.clientY, token });
        session.setCursorContextState(true);
      }
    }
  }, [session, currentUser, isGM]);

  const handleToggleTokenCondition = useCallback((token: Token, condition: Condition) => {
    const current = token.conditions || [];
    const newConditions = current.includes(condition) ? current.filter(c => c !== condition) : [...current, condition];
    session.updateToken(token.id, { conditions: newConditions });
  }, [session]);

  const handleOpenSheet = useCallback((token: Token) => {
    if (token.linkedId) {
      setViewingCharacterId(token.linkedId);
    }
    setTokenContextMenu(null);
  }, []);

  const closeTokenContextMenu = useCallback(() => {
    setTokenContextMenu(null);
    session.setCursorContextState(false);
  }, [session]);

  return {
    tokenContextMenu,
    viewingCharacterId,
    setViewingCharacterId,
    handleOpenTokenModal,
    handleDuplicateToken,
    handleUseTemplate,
    handleTokenContextMenu,
    handleToggleTokenCondition,
    handleOpenSheet,
    closeTokenContextMenu
  };
};
