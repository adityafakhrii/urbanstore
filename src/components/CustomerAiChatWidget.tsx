import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { fetchSizeGuides, SizeGuideRow } from '../services/supabaseService';
import {
  AI_CHAT_DAILY_LIMIT,
  AiChatMessage,
  AiQuotaState,
  consumeAiQuota,
  formatResetCountdown,
  getAiQuotaState,
  sendCustomerAiMessage,
} from '../services/aiAssistantService';
import { AlertBanner } from './ui';

const QUICK_PROMPTS = [
  'Hitung size buat TB 170cm BB 62kg',
  'Rekomendasi produk yang ready stock',
  'Info ongkir dan batas waktu bayar',
];

const WELCOME_MESSAGE: AiChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Halo! Saya Stylist & Customer Service UrbanStore.\nAda yang bisa saya bantu hari ini? Kamu bisa tanya rekomendasi outfit, cek stok katalog, hitung ukuran dari TB dan BB, atau info pengiriman.',
  timestamp: 'Sekarang',
};

export const CustomerAiChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { products } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sizeGuides, setSizeGuides] = useState<SizeGuideRow[]>([]);
  const [quota, setQuota] = useState<AiQuotaState>(() => getAiQuotaState(user?.id));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync quota when auth user changes (guest <-> member)
  useEffect(() => {
    setQuota(getAiQuotaState(user?.id));
  }, [user?.id]);

  // Load size guide data once when chat opens
  useEffect(() => {
    if (!isOpen || sizeGuides.length > 0) return;
    void fetchSizeGuides().then((rows) => {
      if (rows.length > 0) setSizeGuides(rows);
    });
  }, [isOpen, sizeGuides.length]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, sending]);

  // Close with Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleSend = async (overrideText?: string) => {
    const trimmed = (overrideText ?? inputText).trim();
    if (!trimmed || sending) return;

    const latestQuota = getAiQuotaState(user?.id);
    setQuota(latestQuota);
    if (latestQuota.isExhausted) {
      setErrorMsg(
        `Kuota chat harian (${AI_CHAT_DAILY_LIMIT}/24 jam) sudah tercapai. Reset dalam ${formatResetCountdown(
          latestQuota.resetAt
        )}.`
      );
      return;
    }

    setErrorMsg(null);
    const timeLabel = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: timeLabel,
    };

    const nextHistory = [...messages.filter((m) => m.id !== 'welcome'), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInputText('');
    setSending(true);

    const res = await sendCustomerAiMessage({
      history: nextHistory.slice(0, -1),
      userMessage: trimmed,
      products,
      sizeGuides,
    });

    setSending(false);

    if (res.error || !res.reply) {
      setErrorMsg(res.error || 'Terjadi kendala saat menghubungi asisten AI.');
      return;
    }

    const updatedQuota = consumeAiQuota(user?.id);
    setQuota(updatedQuota);

    const aiMsg: AiChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: res.reply,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      {/* Chat Window */}
      {isOpen && (
        <section
          aria-label="UrbanStore AI Stylist & Customer Service"
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[390px] max-h-[78vh] bg-surface-card border border-border-ecru rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-primary text-on-primary flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[19px] text-secondary-container">
                  auto_awesome
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-headline-sm text-sm text-on-primary truncate">
                  UrbanStore Stylist &amp; CS
                </h2>
                <p className="text-[11px] text-on-primary/75">
                  Sisa kuota: {quota.remaining}/{quota.limit} chat (24 jam)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup chat AI"
              className="p-1.5 rounded-full text-on-primary/80 hover:text-on-primary hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface/60 min-h-[260px] max-h-[420px]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-primary text-on-primary rounded-br-sm'
                        : 'bg-surface-card border border-border-ecru text-primary rounded-bl-sm shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start">
                <div className="bg-surface-card border border-border-ecru rounded-2xl rounded-bl-sm px-4 py-3 text-xs text-text-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>Sedang menyiapkan jawaban...</span>
                </div>
              </div>
            )}

            {/* Quick Prompt Suggestions (only when no user messages yet) */}
            {messages.length === 1 && !quota.isExhausted && !sending && (
              <div className="pt-2 space-y-1.5">
                <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted px-1">
                  Contoh Pertanyaan:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void handleSend(q)}
                      className="text-left text-[11px] px-3 py-1.5 rounded-full bg-surface-card border border-border-ecru text-primary hover:border-primary hover:bg-surface-sand transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quota / Error Alerts */}
          {(quota.isExhausted || errorMsg) && (
            <div className="px-4 pt-3 bg-surface-card border-t border-border-ecru">
              {quota.isExhausted ? (
                <AlertBanner variant="warning">
                  Batas maksimal {AI_CHAT_DAILY_LIMIT} chat per 24 jam telah tercapai. Dapat
                  digunakan lagi dalam {formatResetCountdown(quota.resetAt)}.
                </AlertBanner>
              ) : (
                errorMsg && <AlertBanner variant="error">{errorMsg}</AlertBanner>
              )}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3.5 bg-surface-card border-t border-border-ecru flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              disabled={quota.isExhausted || sending}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                quota.isExhausted
                  ? 'Kuota harian habis (maks 5 chat / 24 jam)'
                  : 'Tanya produk, size TB/BB, atau ongkir...'
              }
              className="flex-1 h-10 bg-surface border border-border-ecru rounded-xl px-3.5 text-xs text-primary placeholder:text-text-muted/75 focus:outline-none focus:border-primary disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || quota.isExhausted || sending}
              aria-label="Kirim pesan"
              className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </section>
      )}

      {/* Floating Trigger Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Buka Customer Service & Stylist AI UrbanStore"
          className="h-12 px-4 sm:px-5 rounded-full bg-primary text-on-primary shadow-xl border border-white/15 hover:bg-neutral-800 transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-secondary-container">
            {isOpen ? 'close' : 'chat_bubble'}
          </span>
          <span className="font-label-uppercase text-[11px] uppercase tracking-wider">
            {isOpen ? 'Tutup CS' : 'Tanya Stylist AI'}
          </span>
        </button>
      </div>
    </div>
  );
};
