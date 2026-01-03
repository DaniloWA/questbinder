import React from 'react';
import { GameSessionState } from '../types';
import { apiService } from '../../../services/apiService';
import { TokenTemplate } from '../../../types';

export const useTemplateActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  show: (notification: any) => void
) => {
  const saveTemplate = async (data: any) => {
    const newTemplate: TokenTemplate = { ...data, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, templates: [...prev.templates, newTemplate] }));
    await apiService.post('token_templates', newTemplate);
    show({ type: 'success', message: 'Token salvo como modelo.' });
  };

  const deleteTemplate = async (id: string) => {
    setState(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) }));
    await apiService.delete('token_templates', id);
  };

  return {
    saveTemplate,
    deleteTemplate
  };
};
