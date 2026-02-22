'use client';

import { useRef } from 'react';

type LogoUploaderProps = {
  preview: string | null;
  fileName?: string | null;
  onChange: (file: File | null, preview: string | null) => void;
};

export function LogoUploader({ preview, fileName, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = (file: File | null) => {
    if (!file) {
      onChange(null, null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    onChange(file, objectUrl);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file || !file.type.startsWith('image/')) return;
    handleSelect(file);
  };

  return (
    <div>
      {!preview ? (
        <div
          className="bf-onboard-upload-zone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <span className="bf-onboard-upload-icon" aria-hidden="true">🖼️</span>
          <p>Click to upload or drag and drop</p>
          <span>PNG, JPG, SVG - max 2MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            name="logo"
            onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
            className="bf-hidden-input"
          />
        </div>
      ) : (
        <div className="bf-onboard-logo-preview">
          <img src={preview} alt="Shop logo preview" />
          <div>
            <strong>{fileName ?? 'Uploaded logo'}</strong>
            <button type="button" onClick={() => onChange(null, null)}>
              Remove
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" name="logo" className="bf-hidden-input" />
        </div>
      )}
    </div>
  );
}

