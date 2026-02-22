import { InputHTMLAttributes } from 'react';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  rightIcon?: React.ReactNode;
  error?: string;
};

export function FormField({ label, id, rightIcon, error, className, ...props }: FormFieldProps) {
  return (
    <div className="bf-auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="bf-auth-input-wrap">
        <input id={id} className={className} {...props} />
        {rightIcon ? <span className="bf-auth-input-icon">{rightIcon}</span> : null}
      </div>
      {error ? <p className="bf-auth-field-error">{error}</p> : null}
    </div>
  );
}

