import React from 'react';
import { Handout } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Edit, Share2 } from 'lucide-react';

// A simple markdown to HTML converter
const markdownToHtml = (text: string) => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold font-fantasy mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold font-fantasy mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold font-fantasy mb-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />');
  return html;
};

const HandoutContent: React.FC<{ handout: Handout }> = ({ handout }) => {
  switch (handout.type) {
    case 'text':
      return <div className="prose prose-invert prose-lg max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: markdownToHtml(handout.content) }} />;
    case 'image':
      return <img src={handout.content} alt={handout.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />;
    case 'video_link':
      const videoId = handout.content.split('v=')[1]?.split('&')[0];
      if (!videoId) return <p className="text-destructive">Link de vídeo inválido.</p>;
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return <div className="aspect-video w-full"><iframe width="100%" height="100%" src={embedUrl} title={handout.name} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg"></iframe></div>;
    default: return null;
  }
};

interface HandoutPreviewModalProps {
  handout: Handout | null;
  onClose: () => void;
  onEdit: (handout: Handout) => void;
  onShare: (handout: Handout) => void;
}

export const HandoutPreviewModal: React.FC<HandoutPreviewModalProps> = ({ handout, onClose, onEdit, onShare }) => {
  if (!handout) return null;

  return (
    <Modal isOpen={!!handout} onClose={onClose} title={`Pré-visualização: ${handout.name}`} size="lg">
      <div className="flex flex-col h-[60vh] max-h-[700px]">
        <div className="flex-1 overflow-auto p-4 bg-background/50 rounded-lg flex items-center justify-center my-4">
            <HandoutContent handout={handout} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onEdit(handout)}>
            <Edit className="w-4 h-4 mr-2" /> Editar
          </Button>
          <Button onClick={() => onShare(handout)}>
            <Share2 className="w-4 h-4 mr-2" /> Compartilhar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
