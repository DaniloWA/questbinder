import React from 'react';
import { SheetInput } from '../../ui/SheetPrimitives';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';

interface StatusBarEditorProps {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  value: number;
  max: number;
  visible: boolean;
  onValueChange: (value: number) => void;
  onMaxChange: (max: number) => void;
  onVisibleChange: (visible: boolean) => void;
}

export const StatusBarEditor: React.FC<StatusBarEditorProps> = ({
  label,
  icon,
  iconColor,
  value,
  max,
  visible,
  onValueChange,
  onMaxChange,
  onVisibleChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
        <span className={`flex items-center gap-1 ${iconColor}`}>
          {icon} {label}
        </span>
        <button
          type="button"
          onClick={() => onVisibleChange(!visible)}
          className={`hover:text-white flex items-center gap-1 transition-colors ${visible ? iconColor : 'text-zinc-600'}`}
        >
          {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {visible ? t('vtt.tokens.editModal.statusBar.public') : t('vtt.tokens.editModal.statusBar.hidden')}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <SheetInput
          type="number"
          value={value}
          onChange={e => onValueChange(Number(e.target.value))}
          className="text-center font-bold text-lg bg-zinc-950 rounded border-zinc-800"
          placeholder={t('vtt.tokens.editModal.statusBar.currentPlaceholder')}
        />
        <span className="text-zinc-600">/</span>
        <SheetInput
          type="number"
          value={max}
          onChange={e => onMaxChange(Number(e.target.value))}
          className="text-center font-bold text-lg bg-zinc-950 rounded border-zinc-800 text-zinc-400"
          placeholder={t('vtt.tokens.editModal.statusBar.maxPlaceholder')}
        />
      </div>
    </div>
  );
};
