// Base version from package.json
const BASE_VERSION = '1.5';

// Git SHA injected at build time by Vite
const GIT_SHA = import.meta.env.VITE_GIT_SHA || 'dev';

// Combined version string: "1.5-a3f2c1" or "1.5-dev"
export const APP_VERSION = `${BASE_VERSION}-${GIT_SHA}`;
