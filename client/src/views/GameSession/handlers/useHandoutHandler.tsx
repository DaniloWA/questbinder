import { useState, useCallback } from 'react';
import { useGameSession } from '../../../context/GameSessionContext';
import { Handout } from '../../../types';
import { useTranslation } from '../../../i18n/TranslationContext';
import { useModal } from '../../../context/ModalContext';
import { useNotification } from '../../../context/NotificationContext';
import { Button } from '../../../components/ui/Button';


interface UseHandoutHandlerReturn {
    isHandoutTrayOpen: boolean;
    setIsHandoutTrayOpen: (v: boolean) => void;
    editingHandout: Handout | 'new' | null;
    setEditingHandout: (v: Handout | 'new' | null) => void;
    previewingHandout: Handout | null;
    setPreviewingHandout: (v: Handout | null) => void;
    sharingHandout: Handout | null;
    setSharingHandout: (v: Handout | null) => void;
    handleSaveHandout: (data: Omit<Handout, 'id' | 'createdAt' | 'campaignId' | 'sharedWith'>) => Promise<void>;
    handleDeleteHandout: (handout: Handout) => void;
}

export const useHandoutHandler = (): UseHandoutHandlerReturn => {
    const { t } = useTranslation();
    const session = useGameSession();
    const { openModal, closeModal } = useModal();
    const { show } = useNotification();

    const [isHandoutTrayOpen, setIsHandoutTrayOpen] = useState(false);
    const [editingHandout, setEditingHandout] = useState<Handout | 'new' | null>(null);
    const [previewingHandout, setPreviewingHandout] = useState<Handout | null>(null);
    const [sharingHandout, setSharingHandout] = useState<Handout | null>(null);

    const handleSaveHandout = useCallback(async (data: Omit<Handout, 'id' | 'createdAt' | 'campaignId' | 'sharedWith'>) => {
        if (editingHandout === 'new') {
            await session.createHandout(data);
        } else if (editingHandout && typeof editingHandout !== 'string') {
            await session.updateHandout(editingHandout.id, data);
        }
        setEditingHandout(null);
        show({ type: 'success', message: t('vtt.gameSession.notification.handoutSaved') });
    }, [editingHandout, session, show, t]);

    const handleDeleteHandout = useCallback((handout: Handout) => {
        openModal(
            <>
                <p>{t('vtt.gameSession.modal.handout.deleteConfirm', { name: handout.name })}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={closeModal}>{t('common.cancel')}</Button>
                    <Button variant="destructive" onClick={async () => { await session.deleteHandout(handout.id); closeModal(); }}>{t('common.delete')}</Button>
                </div>
            </>,
            { title: t('vtt.gameSession.modal.handout.deleteTitle'), variant: 'alert' }
        );
    }, [session, t, openModal, closeModal]);

    return {
        isHandoutTrayOpen, setIsHandoutTrayOpen,
        editingHandout, setEditingHandout,
        previewingHandout, setPreviewingHandout,
        sharingHandout, setSharingHandout,
        handleSaveHandout,
        handleDeleteHandout
    };
};
