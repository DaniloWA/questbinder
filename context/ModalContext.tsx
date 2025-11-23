import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal } from '../components/ui/Modal';
import { ModalOptions, ModalContextType } from '../types';

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [options, setOptions] = useState<ModalOptions>({});

  const openModal = useCallback((modalContent: ReactNode, modalOptions: ModalOptions = {}) => {
    setContent(modalContent);
    setOptions(modalOptions);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Delay clearing content to allow animation to finish (300ms)
    setTimeout(() => {
      setContent(null);
      setOptions({});
    }, 300);
  }, []);

  return (
    <ModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      {/* Global Modal Instance */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        {...options}
      >
        {content}
      </Modal>
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};