'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const EXEMPLES = [
  "Un agent qui surveille les mentions de ma marque sur Twitter et envoie un résumé par email",
  "Un agent de support qui répond aux tickets Zendesk et escalade les cas urgents",
  "Un agent qui analyse mes dépenses CSV chaque semaine et fait un rapport",
  "Un agent de veille concurrentielle qui résume les actualités IA chaque matin",
]

const TYPE_STYLE = {
  llm:           'border-violet-500/40 bg-violet-500/10 text-violet-200',
  tool:          'border-sky-500/40    bg-sky-500/10    text-sky-200',
  router:        'border-amber-500/40  bg-amber-500/10  text-amber-200',
  human_in_loop: 'border-teal-500/40   bg-teal-500/10   text-teal-200',
}

const SAFETY_STYLE = {
  low:    'bg-emerald-900/40 text-emerald-300 border-emerald-600/30',
  medium: 'bg-amber-900/40   text-amber-300   border-amber-600/30',
  high:   'bg-red-900/40     text-red-300     border-red-600/30',
}

function NodeCard({ node, index }) {
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '16px',
      background: 'rgba(255,255,255,0.02)',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: -10, right: 12,
        background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '2px 8px', fontSize: 11, color: 'rgba(255,255,255,0.4)'
      }}>Nœud {index + 1}</span>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14 }}>{node.id}</span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20,
              border: '1px solid',
              ...(TYPE_STYLE[node.type] ? Object.fromEntries(
                TYPE_STYLE[node.type].split(' ').map(cls => {
                  if (cls.startsWith('border-')) return ['borderColor', cls.replace('border-', '').replace('/40','').replace('violet-500','#7c3aed').replace('sky-500','#0ea5e9').replace('amber-500','#f59e0b').replace('teal-500','#14b8a6')]
                  if (cls.startsWith('bg-')) return ['background', cls.includes('violet') ? 'rgba(124,58,237,0.1)' : cls.includes('sky') ? 'rgba(14,165,233,0.1)' : cls.includes('amber') ? 'rgba(245,158,11,0.1)' : 'rgba(20,184,166,0.1)']
                  if (cls.startsWith('text-')) return ['color', cls.includes('violet') ? '#c4b5fd' : cls.includes('sky') ? '#7dd3fc' : cls.includes('amber') ? '#fcd34d' : '#5eead4']
                  return ['x','']
                })
              ) : {})
            }}>{node.type}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginBottom: 8 }}>{node.model}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{node.prompt_template}</div>
          {node.tools?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {node.tools.map((t, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 5
                }}>
                  {t.name}
                  {t.sandbox && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} title="sandbox actif" />}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AgentResult({ config, onSave, onCopy }) {
  const safetyS = SAFETY_STYLE[config.safety_level] || SAFETY_STYLE.medium
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: 24,
      background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(14,165,233,0.03))',
      marginTop: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#34d399', textTransform: 'uppercase', letterSpacing: 2 }}>Agent généré</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{config.name}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', maxWidth: 520 }}>{config.description}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
          {[
            { label: `Sécurité : ${config.safety_level}`, style: safetyS },
            { label: `Mémoire : ${config.memory_type}`, style: 'bg-slate-800 text-slate-300 border-slate-600/30' },
            { label: `~${config.estimated_cost_usd_month?.toFixed(2)} $/mois`, style: 'bg-violet-900/40 text-violet-300 border-violet-600/30' },
          ].map((b, i) => (
            <span key={i} style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.7)',
            }}>{b.label}</span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Graphe · {config.nodes?.length} nœuds · Entry: <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{config.entry_point}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {config.nodes?.map((n, i) => (
            <div key={n.id}>
              <NodeCard node={n} index={i} />
              {i < config.nodes.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                  <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {config.edges?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Connexions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {config.edges.map(([a, b], i) => (
              <span key={i} style={{
                fontFamily: 'monospace', fontSize: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '4px 12px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ color: '#a78bfa' }}>{a}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>
                <span style={{ color: '#67e8f9' }}>{b}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <button onClick={onCopy} style={{
          padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.8)', fontSize: 13,
        }}>Copier le JSON</button>
        <button onClick={onSave} style={{
          padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
          background: 'linear-gradient(135deg, #059669, #0d9488)',
          border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
        }}>Sauvegarder l'agent</button>
      </div>
    </div>
  )
}

function SavedList({ agents, onDelete, onView }) {
  if (!agents.length) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
      Aucun agent sauvegardé pour l'instant.
    </div>
  )
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))' }}>
      {agents.map(a => (
        <div key={a.id} style={{
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: 16,
          background: 'rgba(255,255,255,0.02)',
          cursor: 'pointer', transition: 'border-color 0.2s',
        }} onClick={() => onView(a)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.description}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); onDelete(a.id) }} style={{
              marginLeft: 8, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: 11,
            }}>Suppr.</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {a.nodes?.length || 0} nœuds
            </span>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              ~{a.estimated_cost_usd_month?.toFixed(2)}$/mois
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [intent, setIntent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [agents, setAgents] = useState([])
  const [tab, setTab] = useState('create')
  const resultRef = useRef(null)

  useEffect(() => { loadAgents() }, [])

  async function loadAgents() {
    try {
      const r = await fetch('/api/agents')
      const d = await r.json()
      if (Array.isArray(d)) setAgents(d)
    } catch {}
  }

  async function handleGenerate() {
    if (intent.trim().length < 10) { toast.error('Décris ton agent en au moins 10 caractères.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const r = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_intent: intent }),
      })
      const d = await r.json()
      if (!r.ok || d.error) { setError(d); toast.error(d.reason || d.error) }
      else { setResult(d); toast.success('Agent généré !'); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }
    } catch { setError({ error: 'RÉSEAU', reason: 'Impossible de contacter le serveur.' }); toast.error('Erreur réseau.') }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!result) return
    try {
      const r = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(`Agent "${d.name}" sauvegardé !`); await loadAgents(); setTab('library')
    } catch (e) { toast.error('Sauvegarde impossible : ' + e.message) }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' })
      toast.success('Supprimé.'); loadAgents()
    } catch { toast.error('Suppression impossible.') }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      {/* Halos décoratifs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', filter: 'blur(80px)' }} />
      </div>

      {/* Navbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16, color: '#fff',
            }}>M</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.5 }}>MetaAgent</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>AI Agent Builder</div>
            </div>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
            padding: '4px 12px', background: 'rgba(255,255,255,0.03)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Claude Sonnet 4.5
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
            padding: '5px 14px', marginBottom: 24,
          }}>✦ Génération d'agents par IA · LangGraph compatible</div>
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 }}>
            Décris ton agent IA.
            <br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              On construit le graphe.
            </span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Tape une intention en français. Le meta-agent génère un AgentConfig LangGraph complet avec nœuds, outils, mémoire et coût estimé.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
          padding: 4, marginBottom: 28,
        }}>
          {[{ key: 'create', label: 'Créer un agent' }, { key: 'library', label: `Bibliothèque (${agents.length})` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer',
              background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: 'none', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 14, fontWeight: tab === t.key ? 600 : 400, transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'create' && (
          <div>
            {/* Formulaire */}
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, background: 'rgba(255,255,255,0.02)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Décris ton agent</h2>
              <textarea
                value={intent}
                onChange={e => setIntent(e.target.value)}
                disabled={loading}
                rows={5}
                placeholder="Ex : Un agent qui lit mes emails Gmail chaque matin, détecte les demandes clients urgentes et poste un résumé dans Slack #urgent..."
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e8e8f0', fontSize: 14, lineHeight: 1.6, resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit',
                }}
              />

              {/* Exemples */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0' }}>
                {EXEMPLES.map((ex, i) => (
                  <button key={i} onClick={() => setIntent(ex)} disabled={loading} style={{
                    maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'left',
                  }}>💡 {ex.substring(0, 50)}…</button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  Pare-feu sémantique actif
                </span>
                <button onClick={handleGenerate} disabled={loading || intent.trim().length < 10} style={{
                  padding: '12px 28px', borderRadius: 12, cursor: loading ? 'wait' : 'pointer',
                  background: loading || intent.trim().length < 10 ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #db2777)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: intent.trim().length < 10 ? 0.5 : 1,
                }}>
                  {loading ? (
                    <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Construction…</>
                  ) : '✦ Générer l\'agent'}
                </button>
              </div>
            </div>

            {/* Loader */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '48px 0', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, marginTop: 20, background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>🧠</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                  Analyse de l'intention · Sélection des outils · Génération du graphe…
                </p>
              </div>
            )}

            {/* Erreur */}
            {error && !loading && (
              <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>{error.error}</div>
                <div style={{ fontSize: 13, color: 'rgba(252,165,165,0.7)' }}>{error.reason}</div>
              </div>
            )}

            {/* Résultat */}
            <div ref={resultRef}>
              {result && !result.error && !loading && (
                <AgentResult
                  config={result}
                  onSave={handleSave}
                  onCopy={() => { navigator.clipboard.writeText(JSON.stringify(result, null, 2)); toast.success('JSON copié !') }}
                />
              )}
            </div>
          </div>
        )}

        {tab === 'library' && (
          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Agents sauvegardés</h2>
            <SavedList agents={agents} onDelete={handleDelete} onView={a => { setResult(a); setTab('create'); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }} />
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        textarea:focus { border-color: rgba(124,58,237,0.5) !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1) }
        button:hover:not(:disabled) { filter: brightness(1.1) }
      `}</style>
    </div>
  )
}