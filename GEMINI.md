# 5e Character Forge

## Project Overview

This project is a single-page, fully responsive React/TypeScript application for creating, managing, and viewing D&D 5e character sheets. It is designed to be **100% client-side**, using IndexedDB for storage, which means no backend or user accounts are required. All data stays on the user's device.

The application features:
- A step-by-step character creation wizard.
- An interactive character sheet with clickable rolls.
- Realistic 3D dice rolling animations using WebGL.
- The ability to import and export character data as JSON files for backup and sharing.
- A responsive design that works on desktop and mobile devices.

## Building and Running

### Prerequisites

- Node.js 18+ and npm
- A modern web browser with WebGL support

### Key Commands

The following commands are available in `package.json`:

- **`npm run dev`**: Starts the Vite development server, typically available at `http://localhost:3000`.
- **`npm run build`**: Compiles the TypeScript code and builds the application for production into the `dist` directory.
- **`npm run preview`**: Serves the production build locally for testing.
- **`npm run lint`**: Lints the codebase using ESLint to enforce code quality.

### Docker Deployment

The project includes a `Dockerfile` and `docker-compose.yml` for easy deployment using Docker and Nginx. See `DEPLOYMENT.md` for detailed instructions on deploying to a Docker Swarm.

## Development Conventions

- **Technology Stack**: The project is built with React 18, TypeScript, and Vite.
- **Styling**: Styling is done using Tailwind CSS for a utility-first approach.
- **State Management**: State is managed within React components using hooks like `useState`, `useEffect`, and `useCallback`.
- **Data Storage**: All character data is stored in the browser's IndexedDB. Helper functions for interacting with IndexedDB are located in `src/App.tsx`.
- **3D Dice**: The 3D dice rolling feature is implemented using the `@3d-dice/dice-box` library. The main component for this is `src/components/DiceBox3D.tsx`.
- **Code Structure**: The `src` directory is organized into `components`, `utils`, and `types` to maintain a clean architecture.
- **Documentation**: The project is well-documented with several Markdown files explaining the design (`D&D_5e_Character_App_Design.md`), 3D dice implementation (`3D_DICE_IMPLEMENTATION.md`), dice rolling logic (`DICE_ROLLING.md`), and deployment (`DEPLOYMENT.md`).

## Key Files

- **`src/App.tsx`**: The main application component, containing the logic for character management, the character list, and the connection to IndexedDB.
- **`src/components/DiceBox3D.tsx`**: The React component that wraps the `@3d-dice/dice-box` library to render the 3D dice.
- **`src/components/RollHistory.tsx`**: Components for displaying the history of dice rolls.
- **`src/utils/diceRoller.ts`**: Utility functions for creating and managing dice rolls.
- **`package.json`**: Defines the project's dependencies and scripts.
- **`vite.config.ts`**: The configuration file for the Vite build tool.
- **`D&D_5e_Character_App_Design.md`**: Provides a detailed overview of the application's design and features.
- **`3D_DICE_IMPLEMENTATION.md`**: Explains the technical details of the 3D dice rolling feature.
