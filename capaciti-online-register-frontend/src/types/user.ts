export type Role = "CANDIDATE" | "TECH_CHAMP" | "ADMIN";

export interface User {
  id: string;
  name: string;
  role: Role;
}