import { RoleCard } from '@/components/role/RoleCard';
import type { RoleOption, UserRole } from '@/types/role';

type RolesGridProps = {
  roles: RoleOption[];
  selected: UserRole | null;
  onSelect: (role: UserRole) => void;
};

export function RolesGrid({ roles, selected, onSelect }: RolesGridProps) {
  return (
    <div className="bf-roles-grid" role="radiogroup" aria-label="Choose account type">
      {roles.map((role, index) => (
        <RoleCard
          key={role.id}
          role={role}
          isSelected={selected === role.id}
          onSelect={() => onSelect(role.id)}
          animationDelay={index * 0.08}
        />
      ))}
    </div>
  );
}

