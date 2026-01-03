import React from 'react';
import { Backpack, Share2 } from 'lucide-react';
import { Character } from '../../../types';
import { OptimizedNumberInput } from '../../ui/OptimizedNumberInput';
import { SheetHeader } from '../../ui/SheetPrimitives';

interface InventoryTabProps {
  character: Character;
  isEditing: boolean;
  canEdit: boolean;
  updateField: (field: keyof Character, value: any) => void;
  updateFields: (updates: Partial<Character>) => void;
  onShare?: (type: 'item', data: any) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  character, isEditing, canEdit, updateField, updateFields, onShare
}) => {
  return (
    <div className="p-3 md:p-5 space-y-5 pb-20">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-around items-center min-w-[200px]">
          {(Object.keys(character.currency) as Array<keyof typeof character.currency>).map(k => (
            <div key={k as string} className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase text-zinc-500 mb-1">{k}</span>
              <OptimizedNumberInput
                value={character.currency[k]}
                onChange={(val) => updateField('currency', { ...character.currency, [k]: val })}
                className="w-12"
                inputClassName="bg-transparent text-center font-mono font-bold text-white text-sm outline-none border-b border-transparent focus:border-primary focus:bg-white/5 rounded px-0"
                disabled={!canEdit}
                showControls={false}
              />
            </div>
          ))}
        </div>
      </div>

      <SheetHeader title="Equipamento" icon={Backpack} />
      <div className="space-y-1">
        {character.inventory.map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900 hover:border-zinc-700 transition-all group">
            <div className="flex items-center gap-3 min-w-0">
              {isEditing ? (
                <OptimizedNumberInput
                  value={item.qty}
                  onChange={(val) => {
                    const newInventory = character.inventory.map(i => i.id === item.id ? { ...i, qty: val } : i);
                    updateFields({ inventory: newInventory });
                  }}
                  className="w-10"
                  inputClassName="bg-zinc-950 text-zinc-300 text-[10px] font-mono px-1 py-0.5 rounded border border-zinc-700 w-10 text-center outline-none focus:border-primary"
                  showControls={false}
                />
              ) : (
                <div className="bg-zinc-950 text-zinc-500 text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-800 min-w-[24px] text-center">{item.qty}</div>
              )}
              <span className="text-sm text-zinc-200 font-medium truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {item.weight && <span className="text-[10px] text-zinc-600 hidden sm:block">{item.weight}</span>}
              {onShare && <button onClick={() => onShare('item', item)} className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Share2 className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
