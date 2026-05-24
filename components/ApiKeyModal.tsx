'use client';

import { useEffect, useRef, useState } from 'react';

interface ApiKeyModalProps {
  initialKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ initialKey, onSave, onClose }: ApiKeyModalProps) {
  const [value, setValue] = useState(initialKey);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  function handleBgClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-bg" onClick={handleBgClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-icon">🔑</div>
        <h2>Enter your NVIDIA API Key</h2>
        <p>
          Get your free key at <strong>build.nvidia.com</strong>. It starts with{' '}
          <code style={{ fontFamily: 'monospace', background: 'var(--g100)', padding: '2px 6px', borderRadius: 4 }}>
            nvapi-
          </code>{' '}
          and gives you ~40 req/min across all 100+ models.
        </p>
        <label className="modal-label" htmlFor="keyInput">API Key</label>
        <input
          ref={inputRef}
          id="keyInput"
          type="password"
          className="modal-input"
          placeholder="nvapi-..."
          autoComplete="off"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
        />
        <div className="modal-hint">
          Your key is stored only in this browser&apos;s localStorage.{' '}
          <a href="https://build.nvidia.com/settings/api-keys" target="_blank" rel="noreferrer">
            Get a key →
          </a>
        </div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="modal-btn modal-btn-primary" onClick={handleSave}>Save Key</button>
        </div>
      </div>
    </div>
  );
}
