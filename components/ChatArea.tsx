'use client';

import { useEffect, useRef } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAreaProps {
  messages: Message[];
  streaming: boolean;
  streamText: string;
  modelName: string;
  onStarter: (text: string) => void;
}

const STARTERS = [
  'Explain quantum computing simply',
  'Write a Python web scraper',
  'What are the best AI models for coding?',
  'Debug this JavaScript: null.toString()',
  'Compare React vs Vue vs Svelte',
  'Write a cover letter for a software engineer role',
];

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMessage(text: string): string {
  // Code blocks
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  // Inline code
  text = text.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Line breaks
  text = text.replace(/\n/g, '<br>');
  return text;
}

export default function ChatArea({
  messages, streaming, streamText, modelName, onStarter,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText, streaming]);

  if (messages.length === 0 && !streaming) {
    return (
      <div className="msgs">
        <div className="empty">
          <div className="empty-icon">✦</div>
          <h2>What would you like to know?</h2>
          <p>Select a model from the sidebar, then start chatting. All 100+ NVIDIA NIM models stream in real time.</p>
          <div className="empty-starters">
            {STARTERS.map(s => (
              <button key={s} className="starter" onClick={() => onStarter(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  async function copyText(text: string, btn: HTMLButtonElement) {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  }

  return (
    <div className="msgs">
      {messages.map((msg, i) => (
        <div key={i} className={`msg-row msg-row-${msg.role === 'user' ? 'user' : 'ai'}`}>
          <div className={`msg-av ${msg.role === 'user' ? 'user-av' : 'ai-av'}`}>
            {msg.role === 'user' ? 'V' : '✦'}
          </div>
          <div className="msg-body">
            <div className="msg-sender">{msg.role === 'user' ? 'You' : modelName}</div>
            {msg.role === 'user' ? (
              <div className="msg-bubble">{msg.content}</div>
            ) : (
              <>
                <div
                  className="msg-bubble"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                <div className="msg-actions">
                  <button
                    className="msg-action"
                    onClick={e => copyText(msg.content, e.currentTarget)}
                  >
                    Copy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Typing indicator → then streaming bubble */}
      {streaming && streamText === '' && (
        <div className="typing-row">
          <div className="msg-av ai-av">✦</div>
          <div className="typing-dots">
            <div className="td" /><div className="td" /><div className="td" />
          </div>
        </div>
      )}
      {streaming && streamText !== '' && (
        <div className="msg-row msg-row-ai">
          <div className="msg-av ai-av">✦</div>
          <div className="msg-body">
            <div className="msg-sender">{modelName}</div>
            <div
              className="msg-bubble"
              dangerouslySetInnerHTML={{
                __html: formatMessage(streamText) + '<span class="stream-cursor"></span>',
              }}
            />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
