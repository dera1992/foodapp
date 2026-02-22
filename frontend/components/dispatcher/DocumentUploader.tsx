'use client';

import { useRef } from 'react';

type DocumentUploaderProps = {
  label: string;
  hint?: string;
  name: string;
  fileName: string | null;
  onChange: (file: File | null) => void;
  optional?: boolean;
};

export function DispatcherDocumentUploader({ label, hint, name, fileName, onChange, optional }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="bf-dsp-field">
      <label>
        {label}
        {optional ? <span className="bf-dsp-field-hint"> (optional)</span> : null}
      </label>

      <div className="bf-dsp-doc-wrap" onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}>
        <button type="button" className="bf-dsp-doc-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          {fileName ? 'Change file' : 'Choose File'}
        </button>
        <span className="bf-dsp-doc-name">{fileName ?? 'No file chosen'}</span>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept=".pdf,.jpg,.jpeg,.png"
          className="bf-hidden-input"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {fileName ? (
        <div className="bf-dsp-doc-confirm">
          <span aria-hidden="true">✅</span>
          <span>{fileName}</span>
          <button type="button" onClick={() => onChange(null)}>×</button>
        </div>
      ) : null}

      {hint ? <p className="bf-dsp-doc-hint">{hint}</p> : null}
    </div>
  );
}

