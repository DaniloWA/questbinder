import React from 'react';
import { Button } from '../ui/Button';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar'
}) => {
  return (
    <div className="space-y-4">
      <p className="text-zinc-300">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
};
