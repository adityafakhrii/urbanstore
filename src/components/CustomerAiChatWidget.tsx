import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import type { Product } from '../data/products';
import { handleImageError } from '../utils/storage';
import { fetchSizeGuides, SizeGuideRow } from '../services/supabaseService';
import {
  AI_CHAT_DAILY_LIMIT,
  AiChatMessage,
  AiQuotaState,
  clearAiChatHistory,
  consumeAiQuota,
  formatResetCountdown,
  getAiQuotaState,
  loadAiChatHistory,
  saveAiChatHistory,
  sendCustomerAiMessage,
} from '../services/aiAssistantService';
import { AlertBanner, ConfirmDialog } from './ui';

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

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderReplyWithProductLinks(
  text: string,
  products: Product[]
): { nodes: React.ReactNode; matchedProducts: Product[] } {
  if (products.length === 0) {
    return { nodes: text, matchedProducts: [] };
  }

  // Match longest product names first so partial overlaps don't split longer names
  const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
  const byLowerName = new Map<string, Product>();
  sortedProducts.forEach((p) => {
    const key = p.name.trim().toLowerCase();
    if (key) byLowerName.set(key, p);
  });

  const patterns = Array.from(byLowerName.keys()).map(escapeRegExp);
  if (patterns.length === 0) {
    return { nodes: text, matchedProducts: [] };
  }

  const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
  const parts = text.split(regex);
  const matchedMap = new Map<string, Product>();

  const nodes = parts.map((part, idx) => {
    const hit = byLowerName.get(part.trim().toLowerCase());
    if (!hit) return <React.Fragment key={idx}>{part}</React.Fragment>;

    matchedMap.set(hit.id, hit);
    return (
      <Link
        key={`${hit.id}-${idx}`}
        to={`/product/${hit.id}`}
        className="font-semibold text-secondary underline underline-offset-4 decoration-secondary/70 hover:text-primary transition-colors"
      >
        {part}
      </Link>
    );
  });

  return {
    nodes,
    matchedProducts: Array.from(matchedMap.values()),
  };
}

export const CustomerAiChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { products } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    const saved = loadAiChatHistory(user?.id);
    return saved.length > 0 ? [WELCOME_MESSAGE, ...saved] : [WELCOME_MESSAGE];
  });
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [sizeGuides, setSizeGuides] = useState<SizeGuideRow[]>([]);
  const [quota, setQuota] = useState<AiQuotaState>(() => getAiQuotaState(user?.id));
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUserIdRef = useRef<string | undefined>(user?.id);

  // Sync quota & saved chat history when auth user changes (guest <-> member)
  useEffect(() => {
    setQuota(getAiQuotaState(user?.id));
    if (prevUserIdRef.current !== user?.id) {
      prevUserIdRef.current = user?.id;
      const saved = loadAiChatHistory(user?.id);
      setMessages(saved.length > 0 ? [WELCOME_MESSAGE, ...saved] : [WELCOME_MESSAGE]);
      setErrorMsg(null);
    }
  }, [user?.id]);

  // Persist chat history across page refreshes & browser restarts
  useEffect(() => {
    saveAiChatHistory(messages, user?.id);
  }, [messages, user?.id]);

  // Real-time 1-second timer to display live reset countdown & auto-reset quota when 24h elapses
  useEffect(() => {
    if (!isOpen || !quota.resetAt) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      if (quota.resetAt && now >= quota.resetAt) {
        setQuota(getAiQuotaState(user?.id));
        setErrorMsg(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, quota.resetAt, user?.id]);

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

  void nowTick;
  const resetCompact = quota.resetAt ? formatResetCountdown(quota.resetAt, 'compact') : '';
  const resetLong = quota.resetAt ? formatResetCountdown(quota.resetAt, 'long') : '';

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
                <p className="text-[11px] text-on-primary/80 tabular-nums">
                  Sisa kuota: {quota.remaining}/{quota.limit} chat
                  {resetCompact ? ` · Reset ${resetCompact}` : ' (24 jam)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.some((m) => m.id !== 'welcome') && (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  title="Hapus Riwayat Chat"
                  aria-label="Hapus Riwayat Chat"
                  className="p-1.5 rounded-full text-on-primary/75 hover:text-on-primary hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup chat AI"
                className="p-1.5 rounded-full text-on-primary/80 hover:text-on-primary hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface/60 min-h-[260px] max-h-[420px]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const rendered = !isUser
                ? renderReplyWithProductLinks(msg.text, products)
                : { nodes: msg.text, matchedProducts: [] as Product[] };

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
                    {rendered.nodes}
                  </div>

                  {!isUser && rendered.matchedProducts.length > 0 && (
                    <div className="mt-2 w-full max-w-[88%] space-y-1.5">
                      {rendered.matchedProducts.slice(0, 4).map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/product/${prod.id}`}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-card border border-border-ecru hover:border-primary transition-colors shadow-2xs group"
                        >
                          <img
                            src={prod.image}
                            alt={prod.name}
                            onError={handleImageError}
                            className="w-10 h-12 object-cover rounded-lg bg-surface-muted shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-primary truncate group-hover:text-secondary transition-colors">
                              {prod.name}
                            </p>
                            <p className="text-[10px] text-text-muted">{prod.priceFormatted}</p>
                          </div>
                          <span className="text-[10px] font-label-uppercase uppercase tracking-wider text-secondary px-2 shrink-0">
                            Detail →
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

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
                  Batas maksimal {AI_CHAT_DAILY_LIMIT} chat per 24 jam telah tercapai. Kuota
                  otomatis tereset dalam <strong className="tabular-nums">{resetLong}</strong>.
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

      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Hapus Riwayat Chat?"
        description="Seluruh percakapan di jendela chat ini akan dihapus. Sisa kuota chat harian (maks 5 chat per 24 jam) tidak berubah."
        confirmLabel="Ya, Hapus Chat"
        cancelLabel="Batal"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearAiChatHistory(user?.id);
          setMessages([WELCOME_MESSAGE]);
          setErrorMsg(null);
          setConfirmClearOpen(false);
        }}
      />
    </div>
  );
};
