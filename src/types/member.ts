import type { UserRole } from "./role";

export type Member = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};
