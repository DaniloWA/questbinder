import React, { useState } from 'react';
import { Campaign, TokenHoverPermissions } from '../../types';
import { Button } from '../ui/Button';
import { Eye, EyeOff, Save, Shield, User, Box } from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { useNotification } from '../../context/NotificationContext';

interface TokenHoverPermissionsPanelProps {
  campaign: Campaign;
  onUpdate: (updatedCampaign: Campaign) => void;
}

export const TokenHoverPermissionsPanel: React.FC<TokenHoverPermissionsPanelProps> = ({ campaign, onUpdate }) => {
  const { show } = useNotification();
  const [permissions, setPermissions] = useState<TokenHoverPermissions>(
    campaign.permissions?.tokenHover || {
      pc: { showName: true, showHP: true, showResource: true, showConditions: true, showStats: true, showAttributes: true },
      npc: { showName: true, showHP: false, showResource: false, showConditions: true, showStats: false, showAttributes: false },
      object: { showName: true, showConditions: false }
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (type: keyof TokenHoverPermissions, field: string) => {
    setPermissions(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: !(prev[type] as any)[field]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // We need to update the entire permissions object, preserving other permissions
      const updatedPermissions = {
        ...campaign.permissions,
        tokenHover: permissions
      };

      const res = await campaignService.updatePermissions(campaign.id, updatedPermissions);
      if (res.success) {
        show({ type: 'success', message: 'Permissões de visibilidade atualizadas!' });
        onUpdate({ ...campaign, permissions: updatedPermissions });
      } else {
        show({ type: 'error', message: 'Erro ao salvar permissões.' });
      }
    } catch (error) {
      console.error(error);
      show({ type: 'error', message: 'Erro ao salvar permissões.' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    type: keyof TokenHoverPermissions,
    fields: { key: string; label: string; description: string; }[]
  ) => (
    <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
      <div className="bg-zinc-800/50 p-4 border-b border-white/10 flex items-center gap-3">
        <div className="p-2 bg-zinc-950 rounded-lg border border-white/10">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg text-zinc-100">{title}</h3>
          <p className="text-sm text-zinc-400">O que os jogadores veem ao passar o mouse</p>
        </div>
      </div>
      <div className="p-4 space-y-1">
        {fields.map(field => {
          const isVisible = (permissions[type] as any)[field.key];
          return (
            <div
              key={field.key}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isVisible ? 'bg-primary/10 border border-primary/20' : 'hover:bg-zinc-800/50 border border-transparent'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isVisible ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
                <div>
                  <p className={`font-medium ${isVisible ? 'text-zinc-100' : 'text-zinc-400'}`}>
                    {field.label}
                  </p>
                  <p className="text-xs text-zinc-500">{field.description}</p>
                </div>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isVisible}
                    onChange={() => handleToggle(type, field.key)}
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-fantasy text-zinc-100">Configuração de Visibilidade</h2>
          <p className="text-zinc-400 mt-1">
            Controle quais informações são reveladas quando os jogadores passam o mouse sobre os tokens.
            O Mestre sempre vê tudo.
          </p>
        </div>
        <Button size="lg" onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20">
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSection('Heróis (PCs)', <User className="w-6 h-6 text-blue-400" />, 'pc', [
          { key: 'showName', label: 'Nome do Personagem', description: 'Exibir o nome do token' },
          { key: 'showHP', label: 'Barra de Vida (HP)', description: 'Visualizar a barra de vida atual/máxima' },
          { key: 'showResource', label: 'Barra de Recurso', description: 'Visualizar a barra de recurso secundário (Mana, etc)' },
          { key: 'showConditions', label: 'Condições e Efeitos', description: 'Ícones de status (Envenenado, Atordoado, etc)' },
          { key: 'showStats', label: 'Estatísticas Rápidas', description: 'CA, Deslocamento e Percepção Passiva' },
          { key: 'showAttributes', label: 'Atributos e Rolagens', description: 'Botões para rolar testes de atributo' },
        ])}

        {renderSection('Criaturas (NPCs)', <Shield className="w-6 h-6 text-red-400" />, 'npc', [
          { key: 'showName', label: 'Nome da Criatura', description: 'Exibir o nome (ex: Goblin, Dragão)' },
          { key: 'showHP', label: 'Barra de Vida (HP)', description: 'Visualizar a barra de vida' },
          { key: 'showResource', label: 'Barra de Recurso', description: 'Visualizar a barra de recurso secundário' },
          { key: 'showConditions', label: 'Condições e Efeitos', description: 'Ícones de status ativos' },
          { key: 'showStats', label: 'Estatísticas Rápidas', description: 'CA, Deslocamento e Percepção Passiva' },
          { key: 'showAttributes', label: 'Atributos e Rolagens', description: 'Botões para rolar testes' },
        ])}

        {renderSection('Objetos e Itens', <Box className="w-6 h-6 text-amber-400" />, 'object', [
          { key: 'showName', label: 'Nome do Objeto', description: 'Exibir o nome do item/objeto' },
          { key: 'showConditions', label: 'Estados', description: 'Ícones de estado (Quebrado, Trancado, etc)' },
        ])}
      </div>
    </div>
  );
};
