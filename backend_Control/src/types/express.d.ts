import type { AccountRole } from '../modules/users/users.repository';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        name: string;
        shopId: string;
        sessionSecret: string;
        accountRole: AccountRole | null;
      };
    }
  }
}

export {};
