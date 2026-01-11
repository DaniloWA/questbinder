import { useTranslation } from '../../i18n/TranslationContext';
// components/vtt/AttackZonePanel.tsx

import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Snowflake,
  Wind,
  Target,
  Circle,
  Triangle,
  Minus,
  Square,
  X,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  RotateCw
} from 'lucide-react';
import { AttackZoneTemplate, AttackZoneConfig, ATTACK_ZONE_PRESETS } from '../../types/attackZone';

interface AttackZonePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  onCreateCustom: () => void;
  activeZones: AttackZoneConfig[];
  onRemoveZone: (zoneId: string) => void;
  onToggleZoneVisibility: (zoneId: string) => void;
  onDuplicateZone: (zoneId: string) => void;
  onEditZone: (zoneId: string) => void;
}

export const AttackZonePanel: React.FC<AttackZonePanelProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateCustom,
  activeZones,
  onRemoveZone,
  onToggleZoneVisibility,
  onDuplicateZone,
  onEditZone,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: t('vtt.attack.zonepanel.todos.label'), icon: Target },
    { id: 'spell', label: t('vtt.attack.zonepanel.magias.label'), icon: Flame },
    { id: 'ability', label: t('vtt.attack.zonepanel.habilidades.label'), icon: Zap },
    { id: 'weapon', label: t('vtt.attack.zonepanel.armas.label'), icon: Target },
    { id: 'environmental', label: t('vtt.attack.zonepanel.ambiente.label'), icon: Wind },
  ];

  const filteredTemplates = ATTACK_ZONE_PRESETS.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTemplateIcon = (template: AttackZoneTemplate) => {
    const iconMap: Record<string, any> = {
      fireball: Flame,
      cone_of_cold: Snowflake,
      lightning_bolt: Zap,
      burning_hands: Flame,
      thunderwave: Wind,
    };
    return iconMap[template.id] || Target;
  };

  const getShapeIcon = (shape: string) => {
    const shapeMap: Record<string, any> = {
      circle: Circle,
      cone: Triangle,
      line: Minus,
      square: Square,
    };
    return shapeMap[shape] || Circle;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-full max-w-[800px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">{t('vtt.attack.zonepanel.zonasDeAtaque.text')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar - Templates */}
          <div className="md:w-2/3 border-b md:border-b-0 md:border-r border-zinc-700 flex flex-col min-h-0">
            {/* Search */}
            <div className="p-4 border-b border-zinc-700">
              <input
                type="text"
                placeholder={t('vtt.attack.zonepanel.buscarZonas.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 p-4 border-b border-zinc-700 overflow-x-auto">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat.id
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredTemplates.map((template) => {
                const Icon = getTemplateIcon(template);
                const ShapeIcon = getShapeIcon(template.defaultConfig.shape || 'circle');

                return (
                  <button
                    key={template.id}
                    onClick={() => onSelectTemplate(template.id)}
                    className="w-full p-3 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-red-500 rounded-lg transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-red-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-red-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{template.name}</h3>
                          {template.spellLevel && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">{t('vtt.attack.zonepanel.nvel.label')}{template.spellLevel}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-zinc-400 mb-2">{template.description}</p>

                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <div className="flex items-center gap-1">
                            <ShapeIcon className="w-3 h-3" />
                            <span className="capitalize">{template.defaultConfig.shape}</span>
                          </div>

                          {template.defaultConfig.damageFormula && (
                            <span className="text-red-400">
                              {template.defaultConfig.damageFormula} {template.defaultConfig.damageType}
                            </span>
                          )}

                          {template.defaultConfig.saveType && (
                            <span>
                              {template.defaultConfig.saveType.toUpperCase()} DC {template.defaultConfig.saveDC}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('vtt.attack.zonepanel.nenhumaZonaEncontrada.text')}</p>
                </div>
              )}

              {/* Custom Zone Button */}
              <button
                onClick={onCreateCustom}
                className="w-full p-4 bg-zinc-800 hover:bg-zinc-750 border-2 border-dashed border-zinc-700 hover:border-red-500 rounded-lg transition-all text-center"
              >
                <Settings className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <p className="font-semibold text-white">{t('vtt.attack.zonepanel.criarZonaCustomizada.text')}</p>
                <p className="text-sm text-zinc-400 mt-1">{t('vtt.attack.zonepanel.configureManualmente.text')}</p>
              </button>
            </div>
          </div>

          {/* Active Zones Panel */}
          <div className="md:w-1/3 flex flex-col max-h-[30vh] md:max-h-none">
            <div className="p-4 border-b border-zinc-700">
              <h3 className="font-semibold text-white">{t('vtt.attack.zonepanel.zonasAtivas.text')}</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {activeZones.length} {activeZones.length === 1 ? t('vtt.attack.zonepanel.zona.label') : t('vtt.attack.zonepanel.zonas.label')}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeZones.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('vtt.attack.zonepanel.nenhumaZonaAtiva.text')}</p>
                </div>
              ) : (
                activeZones.map((zone) => {
                  const ShapeIcon = getShapeIcon(zone.shape);

                  return (
                    <div
                      key={zone.id}
                      className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: zone.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">
                            {zone.name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                            <ShapeIcon className="w-3 h-3" />
                            <span className="capitalize">{zone.shape}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditZone(zone.id)}
                          className="flex-1 p-1.5 bg-zinc-900 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition-colors"
                          title={t('vtt.attack.zonepanel.editar.title')}
                        >
                          <Settings className="w-3 h-3 mx-auto" />
                        </button>

                        <button
                          onClick={() => onDuplicateZone(zone.id)}
                          className="flex-1 p-1.5 bg-zinc-900 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition-colors"
                          title={t('vtt.attack.zonepanel.duplicar.title')}
                        >
                          <Copy className="w-3 h-3 mx-auto" />
                        </button>

                        <button
                          onClick={() => onToggleZoneVisibility(zone.id)}
                          className="flex-1 p-1.5 bg-zinc-900 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition-colors"
                          title={t('vtt.attack.zonepanel.visibilidade.title')}
                        >
                          <Eye className="w-3 h-3 mx-auto" />
                        </button>

                        <button
                          onClick={() => onRemoveZone(zone.id)}
                          className="flex-1 p-1.5 bg-zinc-900 hover:bg-red-500/20 rounded text-xs text-zinc-400 hover:text-red-400 transition-colors"
                          title={t('vtt.attack.zonepanel.remover.title')}
                        >
                          <Trash2 className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 bg-zinc-900/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-zinc-400">
              <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs">{t('vtt.attack.zonepanel.clique.label')}</kbd>
              {' '}{t('vtt.attack.zonepanel.noMapaPara.text')}</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >{t('vtt.attack.zonepanel.fechar.label')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
