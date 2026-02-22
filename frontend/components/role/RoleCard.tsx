import { Check } from 'lucide-react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { RoleOption } from '@/types/role';

type RoleCardProps = {
  role: RoleOption;
  isSelected: boolean;
  onSelect: () => void;
  animationDelay?: number;
};

export function RoleCard({ role, isSelected, onSelect, animationDelay = 0 }: RoleCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={`bf-role-card ${role.id} ${isSelected ? 'is-selected' : ''}`}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      style={
        {
          animationDelay: `${animationDelay}s`,
          '--role-border': role.colour.border,
          '--role-bg': role.colour.bg,
          '--role-icon-bg': role.colour.iconBg,
          '--role-pill-bg': role.colour.pillBg,
          '--role-pill-text': role.colour.pillText,
          '--role-check-bg': role.colour.checkBg
        } as CSSProperties
      }
    >
      <div className="bf-role-check-ring" aria-hidden="true">
        {isSelected ? <Check size={12} strokeWidth={3} /> : null}
      </div>

      <div className="bf-role-icon" aria-hidden="true">
        {role.emoji}
      </div>

      <h3 className="bf-role-title">{role.title}</h3>
      <p className="bf-role-desc">{role.description}</p>

      <div className="bf-role-pills">
        {role.pills.map((pill) => (
          <span key={pill} className="bf-role-pill">
            {pill}
          </span>
        ))}
      </div>
    </div>
  );
}
