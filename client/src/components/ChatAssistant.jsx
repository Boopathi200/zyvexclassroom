import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiJson } from '../api.js';
import { GlassCard } from './ui/GlassCard.jsx';

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi — I am your Zyvex assistant. Ask about classes, assignments, live sessions, or analytics.' },
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || busy) return;
    setInput('');
    const next = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setBusy(true);
    try {
      const history = next.slice(-12).map((m) => ({ role: m.role, content: m.content }));
      const data = await apiJson('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed, history }),
      });
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      setSuggestions(data.suggestions || []);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: e.message || 'Something went wrong.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Open assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-zyvex-gold to-amber-600 text-black shadow-gold ring-2 ring-white/30 md:bottom-8 md:right-8"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="text-xl font-display font-bold">Z</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-end p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Close backdrop" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative w-full max-w-md overflow-hidden"
            >
              <GlassCard className="flex max-h-[min(640px,80vh)] flex-col border border-white/15 shadow-2xl">
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Zyvex Assistant</p>
                    <p className="text-[10px] text-zinc-500">AI + smart shortcuts</p>
                  </div>
                  <button type="button" className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white" onClick={() => setOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-zyvex-gold text-black rounded-br-md'
                            : 'bg-black/5 text-zinc-800 dark:bg-white/5 dark:text-zinc-100 rounded-bl-md'
                        }`}
                      >
                        {m.content.split('\n').map((line, li) => (
                          <p key={li} className={li > 0 ? 'mt-1' : ''}>
                            {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {busy && <p className="text-xs text-zinc-500">Thinking…</p>}
                  <div ref={endRef} />
                </div>
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-black/5 px-3 py-2 dark:border-white/10">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-zyvex-gold/40 bg-zyvex-gold/10 px-2 py-1 text-[11px] text-zyvex-gold dark:text-zyvex-goldlight"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  className="flex gap-2 border-t border-black/5 p-3 dark:border-white/10"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <input
                    className="flex-1 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm outline-none focus:border-zyvex-gold/60 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    placeholder="Ask anything…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <button type="submit" className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-black">
                    Send
                  </button>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
