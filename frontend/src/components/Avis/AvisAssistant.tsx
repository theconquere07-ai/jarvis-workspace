import { useState, useEffect, useRef } from 'react';
import { Project, AvisConversation, AvisMessage } from '../../types';
import { api } from '../../lib/api';

interface AvisAssistantProps {
  projects: Project[];
  onNavigateTab: (tab: string) => void;
}

const QUICK_PROMPTS = [
  'Generate complete ecosystem telemetry briefing',
  'Which projects need attention or are blocked?',
  'Audit public showcase readiness and gaps',
  'Recommend sprint focus for this week',
];

export function AvisAssistant({ projects, onNavigateTab }: AvisAssistantProps) {
  const [conversations, setConversations] = useState<AvisConversation[]>([]);
  const [currentConvo, setCurrentConvo] = useState<AvisConversation | null>(null);
  const [messages, setMessages] = useState<AvisMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    api.avis.getConversations().then(async (convos) => {
      setConversations(convos);
      if (convos.length > 0) {
        setCurrentConvo(convos[0]);
      } else {
        // Create initial default conversation
        const c = await api.avis.createConversation('A.V.I.S. Core Diagnostics');
        setConversations([c]);
        setCurrentConvo(c);
      }
    });
  }, []);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (currentConvo?.id) {
      api.avis.getMessages(currentConvo.id).then((msgs) => {
        setMessages(msgs);
        if (msgs.length === 0) {
          // Add system welcome message
          setMessages([
            {
              id: 'init-1',
              conversation_id: currentConvo.id,
              user_id: '',
              role: 'assistant',
              content: `**A.V.I.S. ONLINE**\n\n*Authorative Versatile Incross System v2.0*\n\nAll 28 ecosystem repositories and telemetry pipelines are linked. How can I assist with your development roadmap or public showcase today?`,
              suggested_actions: null,
              structured_data: null,
              tokens_used: 0,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      });
    }
  }, [currentConvo?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || !currentConvo) return;
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: AvisMessage = {
      id: `tmp-${Date.now()}`,
      conversation_id: currentConvo.id,
      user_id: '',
      role: 'user',
      content: q,
      suggested_actions: null,
      structured_data: null,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.avis.sendMessage(currentConvo.id, q, {
        total_projects: projects.length,
        active_projects: projects.filter((p) => p.status === 'active').map((p) => p.name),
        in_dev_projects: projects.filter((p) => p.status === 'in_development').map((p) => p.name),
        published_projects: projects.filter((p) => p.publication_status === 'published').map((p) => p.name),
      });

      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), res.userMessage, res.assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversation_id: currentConvo.id,
          user_id: '',
          role: 'assistant',
          content: `*A.V.I.S. Telemetry Notice*: ${err.message || 'Connection anomaly'}. Fallback telemetry operational.`,
          suggested_actions: null,
          structured_data: null,
          tokens_used: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConvo = async () => {
    const title = `A.V.I.S. Session ${conversations.length + 1}`;
    const c = await api.avis.createConversation(title);
    setConversations([c, ...conversations]);
    setCurrentConvo(c);
  };

  const handleActionClick = (action: string) => {
    if (action === 'navigate_projects') onNavigateTab('projects');
    if (action === 'navigate_showcase') onNavigateTab('showcase');
    if (action === 'navigate_growth') onNavigateTab('growth');
  };

  return (
    <div className="split" style={{ height: '100%' }}>
      {/* Sessions Sidebar */}
      <div className="side" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ln)', flex: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse" />
            <b style={{ font: '400 13px/1 var(--ser)', letterSpacing: '0.05em', color: 'var(--tx)' }}>
              A.V.I.S. PROTOCOL
            </b>
          </div>
          <div style={{ color: 'var(--mut)', fontSize: '9px', marginTop: '4px' }}>
            Authorative Versatile Incross System
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`li ${c.id === currentConvo?.id ? 'on' : ''}`}
              onClick={() => setCurrentConvo(c)}
              style={{ fontSize: '11px' }}
            >
              <b>{c.title}</b>
            </button>
          ))}
        </div>

        <button className="li add" onClick={handleNewConvo} style={{ flex: 'none', borderTop: '1px solid var(--ln)' }}>
          + New Intelligence Session
        </button>
      </div>

      {/* Main Chat Interface */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 20px' }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: isUser ? 'var(--dim)' : 'var(--gold)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '6px',
                    }}
                  >
                    {isUser ? 'You' : 'A.V.I.S.'}
                  </div>

                  <div
                    style={{
                      maxWidth: '85%',
                      padding: isUser ? '12px 16px' : '18px 20px',
                      background: isUser ? 'rgba(255,255,255,0.04)' : 'linear-gradient(160deg,#0a0a0f,#000 70%)',
                      border: '1px solid var(--ln2)',
                      fontSize: '12px',
                      lineHeight: 1.8,
                      color: 'var(--tx)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}

                    {/* Action Cards */}
                    {m.suggested_actions && m.suggested_actions.length > 0 && (
                      <div
                        style={{
                          marginTop: '16px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--ln)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        {m.suggested_actions.map((act: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(act.action)}
                            style={{
                              padding: '5px 12px',
                              border: '1px solid var(--gold)',
                              color: 'var(--gold)',
                              fontSize: '10px',
                            }}
                          >
                            {act.label} →
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', fontSize: '11px' }}>
                <span className="pulse" />
                <span>A.V.I.S. synthesizing telemetry…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Quick Prompts */}
        <div
          style={{
            padding: '10px 44px 0',
            maxWidth: '868px',
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              style={{
                fontSize: '10px',
                padding: '4px 10px',
                border: '1px solid var(--ln2)',
                color: 'var(--dim)',
                whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.5)',
              }}
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div style={{ padding: '14px 44px 28px', maxWidth: '868px', margin: '0 auto', width: '100%' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              border: '1px solid var(--ln2)',
              background: '#000',
              padding: '4px 6px',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask A.V.I.S. about projects, architecture, tasks, or showcase strategy…"
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                color: 'var(--tx)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 18px',
                background: input.trim() ? 'var(--tx)' : 'transparent',
                color: input.trim() ? '#000' : 'var(--mut)',
                fontWeight: 500,
                fontSize: '11px',
                transition: 'all 0.12s',
              }}
            >
              Send ↵
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
