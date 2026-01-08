import React from 'react';
import { Button } from '../../ui/Button';
import { BookOpen } from 'lucide-react';

interface TokenModalFooterProps {
  onCancel: () => void;
  onSaveTemplate?: () => void;
  isUploading?: boolean;
}

export const TokenModalFooter: React.FC<TokenModalFooterProps> = ({
  onCancel,
  onSaveTemplate,
  isUploading = false,
}) => {
  return (
    <div className="p-3 md:p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0 z-10">
      <div>
        {onSaveTemplate && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveTemplate}
            className="text-zinc-400 hover:text-white text-xs"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Salvar no Bestiário</span>
            <span className="sm:hidden">Bestiário</span>
          </Button>
        )}
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 sm:flex-none sm:min-w-[140px] shadow-lg shadow-primary/20"
          disabled={isUploading}
        >
          {isUploading ? 'Carregando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
};
