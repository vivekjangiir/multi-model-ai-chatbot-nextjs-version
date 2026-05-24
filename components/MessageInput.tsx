'use client';

import { useRef } from 'react';

interface MessageInputProps {
  disabled: boolean;
  streaming: boolean;
  modelName: string;
  apiKey: string;
  selectedModel: string;
  onSend: (text: string) => void;
}

export default function MessageInput({
  disabled, streaming, modelName, apiKey, selectedModel, onSend,
}: MessageInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function getNote() {
    if (!apiKey && !selectedModel) return 'Set API key and select a model to begin';
    if (!apiKey) return 'Set your API key to start chatting';
    if (!selectedModel) return 'Select a model from the sidebar';
    return `${modelName} · press Enter to send`;
  }

  function autoGrow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const el = ref.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || disabled || streaming) return;
    el.value = '';
    el.style.height = 'auto';
    onSend(text);
  }

  const tokenCount = ref.current
    ? Math.round(ref.current.value.length / 4)
    : 0;

  return (
    <div className="input-area">
      <div className="input-wrap">
        <textarea
          ref={ref}
          placeholder="Message NIM Chat..."
          rows={1}
          onKeyDown={handleKey}
          onInput={autoGrow}
          disabled={disabled || streaming}
        />
        <button
          className="send-btn"
          onClick={submit}
          disabled={disabled || streaming}
          title="Send message"
        >
          ↑
        </button>
      </div>
      <div className="input-footer">
        <div className="input-note">{getNote()}</div>
        <div className="token-count" id="tokenCount"></div>
      </div>
    </div>
  );
}
