import React, { useMemo } from 'react';
import { TokenStats } from '../../../../types';
import { SheetInput, SheetLabel, SheetTextArea } from '../../../ui/SheetPrimitives';
import { calcMod, fmtMod } from '../tokenModalUtils';
import { useTranslation } from '../../../../i18n/TranslationContext';

interface TokenSheetTabProps {
  stats: TokenStats;
  onStatsChange: (stats: TokenStats) => void;
}

const ATTRIBUTES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export const TokenSheetTab: React.FC<TokenSheetTabProps> = ({
  stats,
  onStatsChange,
}) => {
  const { t } = useTranslation();

  const attrLabels: Record<string, string> = useMemo(() => ({
    str: 'FOR',
    dex: 'DES',
    con: 'CON',
    int: 'INT',
    wis: 'SAB',
    cha: 'CAR',
  }), []);

  const updateStats = (updates: Partial<TokenStats>) => {
    onStatsChange({ ...stats, ...updates });
  };

  const updateAttribute = (attr: string, value: number) => {
    onStatsChange({
      ...stats,
      attributes: { ...stats.attributes, [attr]: value },
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Type, Alignment, CR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SheetInput
          label={t('vtt.tokens.editModal.sheet.typeLabel')}
          value={stats.type || ''}
          onChange={e => updateStats({ type: e.target.value })}
          placeholder={t('vtt.tokens.editModal.sheet.typePlaceholder')}
          variant="box"
        />
        <SheetInput
          label={t('vtt.tokens.editModal.sheet.alignmentLabel')}
          value={stats.alignment || ''}
          onChange={e => updateStats({ alignment: e.target.value })}
          placeholder={t('vtt.tokens.editModal.sheet.alignmentPlaceholder')}
          variant="box"
        />
        <SheetInput
          label={t('vtt.tokens.editModal.sheet.crLabel')}
          value={stats.cr || ''}
          onChange={e => updateStats({ cr: e.target.value })}
          placeholder={t('vtt.tokens.editModal.sheet.crPlaceholder')}
          variant="box"
        />
      </div>

      {/* AC, HP Formula, Speed */}
      <div className="grid grid-cols-3 gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
        <div className="space-y-1">
          <SheetLabel>{t('vtt.tokens.editModal.sheet.acLabel')}</SheetLabel>
          <input
            type="number"
            value={stats.ac}
            onChange={e => updateStats({ ac: Number(e.target.value) })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center font-bold"
          />
        </div>
        <div className="space-y-1">
          <SheetLabel>{t('vtt.tokens.editModal.sheet.hpFormulaLabel')}</SheetLabel>
          <input
            value={stats.hpFormula || ''}
            onChange={e => updateStats({ hpFormula: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center text-sm"
            placeholder={t('vtt.tokens.editModal.sheet.hpFormulaPlaceholder')}
          />
        </div>
        <div className="space-y-1">
          <SheetLabel>{t('vtt.tokens.editModal.sheet.speedLabel')}</SheetLabel>
          <input
            value={stats.speed || ''}
            onChange={e => updateStats({ speed: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center text-sm"
            placeholder={t('vtt.tokens.editModal.sheet.speedPlaceholder')}
          />
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-2">
        <SheetLabel>{t('vtt.tokens.editModal.sheet.attributesTitle')}</SheetLabel>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-zinc-900/30 p-2 rounded border border-zinc-800">
          {ATTRIBUTES.map(attr => (
            <div key={attr} className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase text-zinc-500 mb-1">
                {attrLabels[attr] || attr}
              </span>
              <input
                type="number"
                value={stats.attributes[attr]}
                onChange={e => updateAttribute(attr, Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded text-center font-bold text-sm p-1 focus:border-primary outline-none"
              />
              <span className="text-[9px] text-zinc-600 mt-1 font-mono">
                {fmtMod(calcMod(stats.attributes[attr]))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Senses & Languages */}
      <div className="space-y-3">
        <SheetInput
          label={t('vtt.tokens.editModal.sheet.sensesLabel')}
          value={stats.senses || ''}
          onChange={e => updateStats({ senses: e.target.value })}
          placeholder={t('vtt.tokens.editModal.sheet.sensesPlaceholder')}
          variant="box"
          className="text-xs"
        />
        <SheetInput
          label={t('vtt.tokens.editModal.sheet.languagesLabel')}
          value={stats.languages || ''}
          onChange={e => updateStats({ languages: e.target.value })}
          placeholder={t('vtt.tokens.editModal.sheet.languagesPlaceholder')}
          variant="box"
          className="text-xs"
        />
      </div>

      {/* Actions & Notes */}
      <div className="flex-1 flex flex-col min-h-[120px]">
        <SheetLabel>{t('vtt.tokens.editModal.sheet.notesLabel')}</SheetLabel>
        <SheetTextArea
          value={stats.notes || ''}
          onChange={e => updateStats({ notes: e.target.value })}
          placeholder={t('vtt.tokens.editModal.sheet.notesPlaceholder')}
          className="flex-1 font-mono text-xs leading-relaxed bg-zinc-950 border-zinc-800"
        />
      </div>
    </div>
  );
};
