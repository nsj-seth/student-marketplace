import type { User } from "@supabase/supabase-js";
import type { AppRole } from "../modules/roles/role.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: User;
        accessToken: string;
        roles?: AppRole[];
      };
    }
  }
}

export {};
