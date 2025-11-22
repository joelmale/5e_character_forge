import React from 'react';
import { CharacterProvider, MonsterProvider, DiceProvider, ModalProvider, LayoutProvider, ThemeProvider } from './context';
import App from './App';

const AppWithProviders: React.FC = () => {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
};

export default AppWithProviders;