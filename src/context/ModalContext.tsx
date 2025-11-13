import React, { createContext, useContext, ReactNode } from 'react';
import { Equipment } from '../types/dnd';
import { useModalState } from '../hooks';

type ModalState = {
  isOpen: boolean;
  characterId?: string | null;
  characterClass?: string | null;
};

interface ModalContextType {
  // Modal states
  featureModal: { name: string; description: string; source?: string } | null;
  equipmentModal: Equipment | null;
  cantripModalState: ModalState;
  subclassModalState: ModalState;
  asiModalState: ModalState;
  isWizardOpen: boolean;

  // Modal setters
  setFeatureModal: React.Dispatch<React.SetStateAction<{ name: string; description: string; source?: string } | null>>;
  setEquipmentModal: React.Dispatch<React.SetStateAction<Equipment | null>>;
  setIsWizardOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Modal actions
  openCantripModal: (characterId: string, characterClass: string) => void;
  closeCantripModal: () => void;
  openSubclassModal: (characterId: string, characterClass: string) => void;
  closeSubclassModal: () => void;
  openAsiModal: (characterId: string) => void;
  closeAsiModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const modalManagement = useModalState();

  return (
    <ModalContext.Provider value={modalManagement}>
      {children}
    </ModalContext.Provider>
  );
};