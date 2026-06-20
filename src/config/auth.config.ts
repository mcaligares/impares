import { routesConfig } from './routes.config';

export const authConfig = {
  redirects: {
    afterLogin: routesConfig.dashboard,
    afterLogout: routesConfig.login,
    unauthenticated: routesConfig.login,
  },
} as const;
