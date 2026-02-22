export type UserRole = 'customer' | 'shop' | 'dispatcher';

export interface RoleColour {
  border: string;
  bg: string;
  iconBg: string;
  pillBg: string;
  pillText: string;
  checkBg: string;
}

export interface RoleOption {
  id: UserRole;
  emoji: string;
  title: string;
  description: string;
  pills: string[];
  colour: RoleColour;
  redirectTo: string;
}

