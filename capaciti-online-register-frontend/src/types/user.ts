export type Role = "candidate" | "tech-champion" | "admin";
export type UserStatus = "Active" | "Away";

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  candId: string;
  cohort: string;
  programme: string;
  techChampion: string;
  status: UserStatus;
  avatar: string;
}