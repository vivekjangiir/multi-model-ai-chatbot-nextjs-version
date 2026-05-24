'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea, { Message } from '@/components/ChatArea';
import MessageInput from '@/components/MessageInput';
import ApiKeyModal from '@/components/ApiKeyModal';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [apiKey, setApiKey]               = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [modelName, setModelName]         = useState('');
  const [messages, setMessages]           = useState<Message[]>([]);
  const [streaming, setStreaming]         = useState(false);
  const [streamText, setStreamText]       = useState('');
  const [showKeyModal, setShowKeyModal]   = useState(false);
  const [toast, setToast]                 = useState('');
  const toastTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted state
  useEffect(() => {
    const key   = localStorage.getItem('nim_api_key') ?? '';
    const model = localStorage.getItem('nim_model') ?? '';
    setApiKey(key);
    if (model) {
      setSelectedModel(model);
      // Resolve name from catalog dynamically
      import('@/lib/catalog').then(({ CATALOG }) => {
        for (const models of Object.values(CATALOG)) {
          const m = models.find(x => x.id === model);
          if (m) { setModelName(m.name); break; }
        }
      });
    }
    if (!key) setTimeout(() => setShowKeyModal(true), 400);
  }, []);

  function showToast(msg: string, duration = 3000) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), duration);
  }

  function handleSelectModel(id: string, name: string) {
    setSelectedModel(id);
    setModelName(name);
    localStorage.setItem('nim_model', id);
    setMessages([]);
    setStreamText('');
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  function handleSaveKey(key: string) {
    if (!key.startsWith('nvapi-')) { showToast('⚠️ Key should start with nvapi-'); return; }
    setApiKey(key);
    localStorage.setItem('nim_api_key', key);
    setShowKeyModal(false);
    showToast('✓ API key saved');
  }

  function clearChat() {
    setMessages([]);
    setStreamText('');
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text || streaming || !apiKey || !selectedModel) return;

    const history: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(history);
    setStreaming(true);
    setStreamText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nvidia-key': apiKey,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: history,
          stream: true,
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        if (res.status === 401) errMsg = '❌ Invalid API key. Click "Set API Key" to update it.';
        else if (res.status === 403) errMsg = '❌ Access denied. This model may require a different plan.';
        else if (res.status === 429) errMsg = '⚠️ Rate limit hit (~40 req/min on free tier). Wait a moment.';
        else if (res.status === 404) errMsg = '❌ Model not found. It may have been deprecated.';
        setMessages([...history, { role: 'assistant', content: errMsg }]);
        setStreamText('');
        setStreaming(false);
        return;
      }

      if (!res.body) throw new Error('No response body');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta: string = json.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              fullText += delta;
              setStreamText(fullText);
            }
          } catch { /* partial JSON — ignore */ }
        }
      }

      setMessages([...history, { role: 'assistant', content: fullText }]);
      setStreamText('');

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages([...history, { role: 'assistant', content: `Connection error: ${msg}` }]);
      setStreamText('');
    }

    setStreaming(false);
  }, [messages, streaming, apiKey, selectedModel]);

  const inputDisabled = !apiKey || !selectedModel;

  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        selectedModel={selectedModel}
        apiKey={apiKey}
        onSelectModel={handleSelectModel}
        onOpenKeyModal={() => setShowKeyModal(true)}
      />

      {/* Main */}
      <div className="main">
        {/* Top bar */}
        <div className="top-bar">
          <button
            className="tb-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="tb-model-wrap">
            <div className="tb-model-name">{modelName || 'Select a model'}</div>
            <div className="tb-model-id">{selectedModel || 'Choose from the sidebar →'}</div>
          </div>
          <div className="tb-actions">
            <div className="tb-badge">FREE</div>
            <button className="tb-btn" onClick={clearChat}>Clear</button>
          </div>
        </div>

        {/* Chat area */}
        <ChatArea
          messages={messages}
          streaming={streaming}
          streamText={streamText}
          modelName={modelName}
          onStarter={sendMessage}
        />

        {/* Input */}
        <MessageInput
          disabled={inputDisabled}
          streaming={streaming}
          modelName={modelName}
          apiKey={apiKey}
          selectedModel={selectedModel}
          onSend={sendMessage}
        />
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <ApiKeyModal
          initialKey={apiKey}
          onSave={handleSaveKey}
          onClose={() => setShowKeyModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-show`}>{toast}</div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
