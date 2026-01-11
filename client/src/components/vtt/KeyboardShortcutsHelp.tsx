import React from 'react';
import { useTranslation } from '../../i18n/TranslationContext';
import { Modal } from '../ui/Modal';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const shortcuts = [
    { key: 'Space', description: t('vtt.keyboard.nextTurn.description') },
    { key: 'Shift + ←', description: t('vtt.keyboard.prevTurn.description') },
    { key: 'H', description: t('vtt.keyboard.toggleHistory.description') },
    { key: 'Ctrl/Cmd + S', description: t('vtt.keyboard.toggleSuggestions.description') },
    { key: 'Esc', description: t('vtt.keyboard.closePanel.description') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('vtt.keyboard.title')} size="sm">
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          {t('vtt.keyboard.useShortcuts.text')}
        </p>

        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-zinc-900/50 rounded border border-zinc-800"
            >
              <span className="text-sm text-zinc-300">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-mono bg-zinc-950 border border-zinc-700 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 italic">
            {t('vtt.keyboard.tip.text')}
          </p>
        </div>
      </div>
    </Modal>
  );
};
