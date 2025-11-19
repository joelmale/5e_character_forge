import React from 'react';
import { CharacterProvider, MonsterProvider, DiceProvider, ModalProvider, LayoutProvider } from './context';
import App from './App';

const AppWithProviders: React.FC = () => {
  return (
    <CharacterProvider>
      <MonsterProvider>
        <DiceProvider>
          <ModalProvider>
            <LayoutProvider>
              <App />
            </LayoutProvider>
          </ModalProvider>
        </DiceProvider>
      </MonsterProvider>
    </CharacterProvider>
  );
};

export default AppWithProviders;