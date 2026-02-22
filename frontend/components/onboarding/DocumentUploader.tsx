'use client';

import { useRef } from 'react';

type DocumentUploaderProps = {
  fileName: string | null;
  onChange: (file: File | null) => void;
};

export function DocumentUploader({ fileName, onChange }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <div className="bf-onboard-doc-wrap">
        <button type="button" className="bf-onboard-doc-btn" onClick={() => inputRef.current?.click()}>
          Choose File
        </button>
        <span className={`bf-onboard-doc-name ${fileName ? 'is-selected' : ''}`}>{fileName ?? 'No file chosen'}</span>
        <input
          ref={inputRef}
          type="file"
          name="business_document"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="bf-hidden-input"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </div>

      {fileName ? (
        <p className="bf-onboard-doc-ready">
          <span aria-hidden="true">✅</span>
          {fileName} - ready to upload
          <button type="button" onClick={() => onChange(null)}>×</button>
        </p>
      ) : null}
    </div>
  );
}

