'use client';

import { useState } from 'react';
import { CATALOG, NimModel } from '@/lib/catalog';

interface SidebarProps {
  open: boolean;
  selectedModel: string;
  apiKey: string;
  onSelectModel: (id: string, name: string) => void;
  onOpenKeyModal: () => void;
}

export default function Sidebar({
  open, selectedModel, apiKey, onSelectModel, onOpenKeyModal,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const q = query.toLowerCase();

  function toggleCat(cat: string) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  const keyLabel = apiKey ? `Key: ${apiKey.slice(0, 14)}…` : 'Set API Key';

  return (
    <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
      {/* Header */}
      <div className="sb-head">
        <div className="sb-logo">
          <div className="sb-logo-icon">✦</div>
          NIM Chat
        </div>
        <div className="sb-search">
          <span className="sb-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search models..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Model list */}
      <div className="sb-models">
        {Object.entries(CATALOG).map(([cat, models]) => {
          const filtered: NimModel[] = q
            ? models.filter(m =>
                m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
              )
            : models;
          if (!filtered.length) return null;
          const isOpen = !collapsed[cat];
          return (
            <div key={cat} className={`sb-cat ${isOpen ? 'sb-cat-open' : 'sb-cat-closed'}`}>
              <div className="sb-cat-header" onClick={() => toggleCat(cat)}>
                <span className="sb-cat-name">{cat}</span>
                <span className="sb-cat-arrow">›</span>
              </div>
              <div className="sb-cat-list">
                {filtered.map(m => (
                  <div
                    key={m.id}
                    className={`sb-model${selectedModel === m.id ? ' sb-model-active' : ''}`}
                    onClick={() => onSelectModel(m.id, m.name)}
                  >
                    <div className="sm-name">{m.name}</div>
                    <div className="sm-id">{m.id}</div>
                    {m.tag && <span className="sm-tag">{m.tag}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="sb-bottom">
        <button className="sb-key-btn" onClick={onOpenKeyModal}>
          <div className={`key-dot${apiKey ? ' key-dot-active' : ''}`} />
          <span>{keyLabel}</span>
        </button>
      </div>
    </aside>
  );
}
