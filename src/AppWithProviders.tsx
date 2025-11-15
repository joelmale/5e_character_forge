import React from 'react';
import { CharacterProvider, DiceProvider, ModalProvider, LayoutProvider } from './context';
import App from './App';

const AppWithProviders: React.FC = () => {
  return (
    <CharacterProvider>
      <DiceProvider>
        <ModalProvider>
          <LayoutProvider>
            <App />
          </LayoutProvider>
        </ModalProvider>
      </DiceProvider>
    </CharacterProvider>
  );
};

export default AppWithProviders;