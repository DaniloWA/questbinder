import React from 'react';
import { Activity, Brain } from 'lucide-react';
import { Character, Attributes } from '../../../types';
import { OptimizedNumberInput } from '../../ui/OptimizedNumberInput';
import { SKILLS_DATA } from '../../../data/rules';

interface SheetSidebarProps {
  character: Character;
  isEditing: boolean;
  canEdit: boolean;
  onUpdateAttribute: (attr: keyof Attributes, val: number) => void;
  onUpdateSkills: (skills: string[], expertise: string[]) => void;
  onRoll: (label: string, mod: number) => void;
}

const calcMod = (score: number) => Math.floor((score - 10) / 2);
const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export const SheetSidebar: React.FC<SheetSidebarProps> = ({
  character, isEditing, canEdit, onUpdateAttribute, onUpdateSkills, onRoll
}) => {
  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-3 space-y-4 bg-zinc-900/50">
      {/* ATTRIBUTES */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Activity className="w-3 h-3" /> Atributos</h3>
        {(Object.keys(character.attributes) as Array<keyof Attributes>).map(attr => {
          const score = character.attributes[attr];
          const mod = calcMod(score);
          return (
            <div key={attr as string} className="bg-zinc-950 border border-zinc-800 rounded-lg p-1 flex items-center gap-2 group hover:border-zinc-600 transition-colors">
              <button
                className="w-10 h-10 bg-zinc-800 rounded flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-colors shrink-0 border border-zinc-700"
                onClick={() => onRoll(attr.toUpperCase(), mod)}
              >
                <span className="text-[9px] font-bold uppercase opacity-70 leading-none mb-0.5">{attr}</span>
                <span className="text-base font-bold leading-none">{fmtMod(mod)}</span>
              </button>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-baseline">
                  {isEditing ? (
                    <OptimizedNumberInput
                      value={score}
                      onChange={(val) => onUpdateAttribute(attr, val)}
                      className="w-16"
                      showControls={false}
                    />
                  ) : (
                    <span className="text-xs font-bold text-zinc-300">{score}</span>
                  )}
                  <button className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors" onClick={() => onRoll(`Save ${attr.toUpperCase()}`, mod + character.profBonus)}>Save</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-px bg-zinc-800 w-full" />

      {/* SKILLS */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Brain className="w-3 h-3" /> Perícias</h3>
        {SKILLS_DATA.map(skill => {
          const attr = character.attributes[skill.attr];
          const mod = calcMod(attr);
          const isProf = character.skills.includes(skill.id);
          const isExpert = character.expertise?.includes(skill.id);
          const total = mod + (isProf ? character.profBonus : 0) + (isExpert ? character.profBonus : 0);

          return (
            <div key={skill.id} className="flex items-center gap-1 group">
              {isEditing && (
                <button
                  onClick={() => {
                    let newSkills = [...character.skills];
                    let newExpertise = [...(character.expertise || [])];

                    if (isExpert) {
                      newExpertise = newExpertise.filter(s => s !== skill.id);
                      newSkills = newSkills.filter(s => s !== skill.id);
                    } else if (isProf) {
                      newExpertise.push(skill.id);
                    } else {
                      newSkills.push(skill.id);
                    }

                    onUpdateSkills(newSkills, newExpertise);
                  }}
                  className={`w-3 h-3 rounded-full border ${isExpert ? 'bg-yellow-500 border-yellow-500' : isProf ? 'bg-primary border-primary' : 'border-zinc-600'} hover:opacity-80`}
                />
              )}
              <button
                onClick={() => onRoll(skill.name, total)}
                className="flex-1 flex items-center justify-between px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  {!isEditing && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isExpert ? 'bg-yellow-500' : isProf ? 'bg-primary' : 'bg-zinc-700'}`} />}
                  <span className={`text-xs truncate ${isProf ? 'text-zinc-200 font-medium' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {skill.name}
                  </span>
                </div>
                <span className={`text-xs font-mono shrink-0 ${isProf ? 'text-white' : 'text-zinc-600'}`}>
                  {fmtMod(total)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
