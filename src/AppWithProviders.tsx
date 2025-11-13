import React from 'react';
import { CharacterProvider, DiceProvider, ModalProvider } from './context';
import App from './App';

const AppWithProviders: React.FC = () => {
  return (
    <CharacterProvider>
      <DiceProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </DiceProvider>
    </CharacterProvider>
  );
};

export default AppWithProviders;