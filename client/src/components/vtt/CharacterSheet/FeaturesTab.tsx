import React from 'react';
import { Sparkles, Share2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { Character } from '../../../types';
import { OptimizedTextInput } from '../../ui/OptimizedTextInput';
import { SheetHeader } from '../../ui/SheetPrimitives';

interface FeaturesTabProps {
  character: Character;
  isEditing: boolean;
  updateFields: (updates: Partial<Character>) => void;
  onShare?: (type: 'feature', data: any) => void;
}

export const FeaturesTab: React.FC<FeaturesTabProps> = ({
  character, isEditing, updateFields, onShare
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-3 md:p-5 space-y-5 pb-20">
      <SheetHeader title={t('vtt.character.features.title')} icon={Sparkles} />
      <div className="space-y-2">
        {character.features.map(feat => (
          <div key={feat.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-all group">
            <div className="flex justify-between items-start mb-1">
              {isEditing ? (
                <div className="flex-1 pr-2 space-y-1">
                  <OptimizedTextInput
                    value={feat.name}
                    onChange={(val) => {
                      const newFeatures = character.features.map(f => f.id === feat.id ? { ...f, name: val } : f);
                      updateFields({ features: newFeatures });
                    }}
                    className="w-full"
                    inputClassName="bg-zinc-950 text-sm font-bold text-white border border-zinc-700 rounded px-1"
                    placeholder={t('vtt.character.features.name.placeholder')}
                  />
                  <OptimizedTextInput
                    value={feat.source}
                    onChange={(val) => {
                      const newFeatures = character.features.map(f => f.id === feat.id ? { ...f, source: val } : f);
                      updateFields({ features: newFeatures });
                    }}
                    className="w-full"
                    inputClassName="bg-zinc-950 text-[10px] text-zinc-500 border border-zinc-700 rounded px-1"
                    placeholder={t('vtt.character.features.source.placeholder')}
                  />
                </div>
              ) : (
                <div>
                  <div className="font-bold text-sm text-zinc-200">{feat.name}</div>
                  <div className="text-[10px] text-zinc-500">{feat.source}</div>
                </div>
              )}
              {onShare && <button onClick={() => onShare('feature', feat)} className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Share2 className="w-3.5 h-3.5" /></button>}
            </div>
            {isEditing ? (
              <OptimizedTextInput
                value={feat.description}
                onChange={(val) => {
                  const newFeatures = character.features.map(f => f.id === feat.id ? { ...f, description: val } : f);
                  updateFields({ features: newFeatures });
                }}
                className="w-full"
                inputClassName="bg-zinc-950 text-xs text-zinc-400 border border-zinc-700 rounded px-1 w-full"
                multiline
                placeholder={t('vtt.character.features.description.placeholder')}
              />
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{feat.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
