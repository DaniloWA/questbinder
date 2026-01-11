import { useTranslation } from '../../i18n/TranslationContext';
// components/vtt/AttackZoneConfigModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { X, Circle, Triangle, Minus, Square, Maximize2, Eye, Target } from 'lucide-react';
import { AttackZoneConfig, AttackZoneShape, AttackZonePropagation, AttackZoneTargeting } from '../../types/attackZone';

interface AttackZoneConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Partial<AttackZoneConfig>) => void;
  initialConfig?: Partial<AttackZoneConfig>;
  title?: string;
}

const DEFAULT_CONFIG_BASE: Partial<AttackZoneConfig> = {
  shape: 'circle' as AttackZoneShape,
  radius: 3,
  length: 5,
  width: 2,
  angle: 53,
  propagation: 'blocked' as AttackZonePropagation,
  respectsVision: true,
  targeting: 'all' as AttackZoneTargeting,
  color: 'rgba(255, 0, 0, 0.3)',
  opacity: 0.3,
  borderColor: 'rgba(255, 0, 0, 0.8)',
  borderWidth: 2,
  showAffectedTokens: true,
  affectedTokenColor: 'rgba(0, 255, 0, 0.5)',
};

/**
 * Converts rgba or rgb color string to hex format
 */
const rgbaToHex = (color: string | undefined): string => {
  if (!color) return '#ff0000';

  // If already hex, return as is
  if (color.startsWith('#')) return color;

  // Parse rgba/rgb format
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#ff0000';

  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
};

/**
 * Converts hex color to rgba format with alpha
 */
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Extracts alpha from rgba color string
 */
const getAlphaFromRgba = (color: string | undefined): number => {
  if (!color) return 0.3;
  const match = color.match(/rgba?\([^)]+,\s*([\d.]+)\s*\)/);
  return match ? parseFloat(match[1]) : 0.3;
};

export const AttackZoneConfigModal: React.FC<AttackZoneConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = {},
  title,
}) => {
  const { t } = useTranslation();

  const DEFAULT_CONFIG = {
    ...DEFAULT_CONFIG_BASE,
    name: t('vtt.attack.zoneconfigmodal.novaZona.text'),
  };

  const [config, setConfig] = useState<Partial<AttackZoneConfig>>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const displayTitle = title || t('vtt.attack.zoneconfigmodal.configurarZonaDe.title');

  // Track if modal was previously open to detect open/close transitions
  const wasOpenRef = useRef(false);

  // Sync config when modal opens (not on every render to avoid infinite loop)
  useEffect(() => {
    // Only reset config when transitioning from closed to open
    if (isOpen && !wasOpenRef.current) {
      setConfig({
        ...DEFAULT_CONFIG,
        ...initialConfig,
      });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]); // Removed initialConfig from deps to avoid infinite loop


  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateConfig = (updates: Partial<AttackZoneConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const shapes: { value: AttackZoneShape; label: string; icon: any; }[] = [
    { value: 'circle', label: t('vtt.attack.zoneconfigmodal.crculo.label'), icon: Circle },
    { value: 'cone', label: t('vtt.attack.zoneconfigmodal.cone.label'), icon: Triangle },
    { value: 'line', label: t('vtt.attack.zoneconfigmodal.line.label'), icon: Minus },
    { value: 'square', label: t('vtt.attack.zoneconfigmodal.quadrado.label'), icon: Square },
    { value: 'rectangle', label: t('vtt.attack.zoneconfigmodal.retngulo.label'), icon: Maximize2 },
  ];

  const propagations: { value: AttackZonePropagation; label: string; description: string; }[] = [
    { value: 'blocked', label: t('vtt.attack.zoneconfigmodal.bloqueado.label'), description: t('vtt.attack.zoneconfigmodal.paraEmParedes.text') },
    { value: 'penetrating', label: t('vtt.attack.zoneconfigmodal.penetrante.label'), description: t('vtt.attack.zoneconfigmodal.atravessaTudo.text') },
    { value: 'spreading', label: t('vtt.attack.zoneconfigmodal.espalhamento.label'), description: t('vtt.attack.zoneconfigmodal.contornaObstculos.text') },
  ];

  const targetings: { value: AttackZoneTargeting; label: string; icon: any; }[] = [
    { value: 'all', label: t('vtt.attack.zoneconfigmodal.todos.label'), icon: Target },
    { value: 'allies', label: t('vtt.attack.zoneconfigmodal.aliados.label'), icon: Target },
    { value: 'enemies', label: t('vtt.attack.zoneconfigmodal.inimigos.label'), icon: Target },
    { value: 'objects', label: t('vtt.attack.zoneconfigmodal.objetos.label'), icon: Target },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">{displayTitle}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.nomeDaZona.text')}</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => updateConfig({ name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={t('vtt.attack.zoneconfigmodal.exBolaDe.placeholder')}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.descrioOpcional.text')}</label>
            <textarea
              value={config.description || ''}
              onChange={(e) => updateConfig({ description: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={2}
              placeholder={t('vtt.attack.zoneconfigmodal.descrioDaZona.placeholder')}
            />
          </div>

          {/* Forma */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.forma.label')}</label>
            <div className="grid grid-cols-3 gap-2">
              {shapes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateConfig({ shape: value })}
                  className={`p-3 rounded-lg border-2 transition-all ${config.shape === value
                    ? 'bg-red-500/20 border-red-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dimensões */}
          <div className="grid grid-cols-2 gap-4">
            {(config.shape === 'circle' || config.shape === 'square') && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.raioQuadrados.text')}</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.radius || 3}
                  onChange={(e) => updateConfig({ radius: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            {(config.shape === 'cone' || config.shape === 'line' || config.shape === 'rectangle') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.comprimentoQuadrados.text')}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.length || 5}
                    onChange={(e) => updateConfig({ length: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.larguraQuadrados.text')}</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.width || 2}
                    onChange={(e) => updateConfig({ width: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </>
            )}

            {config.shape === 'cone' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.nguloGraus.text')}</label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={config.angle || 53}
                  onChange={(e) => updateConfig({ angle: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}
          </div>

          {/* Propagação */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.tipoDePropagao.text')}</label>
            <div className="space-y-2">
              {propagations.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => updateConfig({ propagation: value })}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${config.propagation === value
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <div className="font-medium text-white">{label}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Respeita Visão */}
          <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
            <div>
              <div className="font-medium text-white">{t('vtt.attack.zoneconfigmodal.respeitarLinhaDe.text')}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{t('vtt.attack.zoneconfigmodal.usaClculoDe.text')}</div>
            </div>
            <button
              onClick={() => updateConfig({ respectsVision: !config.respectsVision })}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.respectsVision ? 'bg-red-500' : 'bg-zinc-700'
                }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.respectsVision ? 'translate-x-6' : ''
                  }`}
              />
            </button>
          </div>

          {/* Targeting */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.alvos.label')}</label>
            <div className="grid grid-cols-2 gap-2">
              {targetings.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateConfig({ targeting: value })}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${config.targeting === value
                    ? 'bg-red-500/20 border-red-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.corDaZona.text')}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={rgbaToHex(config.color)}
                  onChange={(e) => {
                    const alpha = config.opacity || 0.3;
                    updateConfig({ color: hexToRgba(e.target.value, alpha) });
                  }}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.opacity ?? getAlphaFromRgba(config.color)}
                  onChange={(e) => {
                    const alpha = parseFloat(e.target.value);
                    const hex = rgbaToHex(config.color);
                    updateConfig({
                      color: hexToRgba(hex, alpha),
                      opacity: alpha
                    });
                  }}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.corDaBorda.text')}</label>
              <input
                type="color"
                value={rgbaToHex(config.borderColor)}
                onChange={(e) => {
                  updateConfig({ borderColor: hexToRgba(e.target.value, 0.8) });
                }}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Highlight de Tokens */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div>
                <div className="font-medium text-white text-sm">{t('vtt.attack.zoneconfigmodal.destacarTokens.text')}</div>
                <div className="text-xs text-zinc-400">{t('vtt.attack.zoneconfigmodal.mostrarContornoNos.text')}</div>
              </div>
              <button
                onClick={() => updateConfig({ showAffectedTokens: !config.showAffectedTokens })}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.showAffectedTokens ? 'bg-green-500' : 'bg-zinc-700'
                  }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.showAffectedTokens ? 'translate-x-6' : ''
                    }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t('vtt.attack.zoneconfigmodal.corDoHighlight.text')}</label>
              <input
                type="color"
                value={rgbaToHex(config.affectedTokenColor)}
                onChange={(e) => {
                  updateConfig({ affectedTokenColor: hexToRgba(e.target.value, 0.5) });
                }}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Dano e Efeitos (Opcional) */}
          <div className="border-t border-zinc-700 pt-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">{t('vtt.attack.zoneconfigmodal.efeitosOpcional.text')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('vtt.attack.zoneconfigmodal.frmulaDeDano.text')}</label>
                <input
                  type="text"
                  value={config.damageFormula || ''}
                  onChange={(e) => updateConfig({ damageFormula: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t('vtt.attack.zoneconfigmodal.ex8d6.placeholder')}
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('vtt.attack.zoneconfigmodal.tipoDeDano.text')}</label>
                <input
                  type="text"
                  value={config.damageType || ''}
                  onChange={(e) => updateConfig({ damageType: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t('vtt.attack.zoneconfigmodal.exFire.placeholder')}
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('vtt.attack.zoneconfigmodal.savingThrow.text')}</label>
                <input
                  type="text"
                  value={config.saveType || ''}
                  onChange={(e) => updateConfig({ saveType: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t('vtt.attack.zoneconfigmodal.exDex.placeholder')}
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">DC</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.saveDC || ''}
                  onChange={(e) => updateConfig({ saveDC: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t('vtt.attack.zoneconfigmodal.ex15.placeholder')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-700 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >{t('vtt.attack.zoneconfigmodal.cancelar.label')}</button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >{t('vtt.attack.zoneconfigmodal.salvarConfigurao.text')}</button>
        </div>
      </div>
    </div>
  );
};
