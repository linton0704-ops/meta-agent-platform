'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const EXEMPLES = [
  "Un agent qui surveille les mentions de ma marque sur Twitter et envoie un résumé par email",
  "Un agent de support qui répond aux tickets Zendesk et escalade les cas urgents",
  "Un agent qui analyse mes dépenses CSV chaque semaine et fait un rapport",
  "Un agent de veille concurrentielle qui résume les actualités IA chaque matin",
]

const TYPE_COLORS = {
  llm:           { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#c4b5fd', dot: '#8b5cf6' },
  tool:          { bg: 'rgba(14,165,233,0.15)',  border: 'rgba(14,165,233,0.4)',  text: '#7dd3fc', dot: '#0ea5e9' },
  router:        { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  text: '#fcd34d', dot: '#f59e0b' },
  human_in_loop: { bg: 'rgba(20,184,166,0.15)',  border: 'rgba(20,184,166,0.4)',  text: '#5eead4', dot: '#14b8a6' },
}

const SAFETY_COLORS = {
  low:    { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
  medium: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
  high:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  text: '#fca5a5' },
}

function NodeCard({ node, index, total }) {
  const c = TYPE_COLORS[node.type] || TYPE_COLORS.llm
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: '20px 20px 20px 24px',
        background: c.bg,
        backdropFilter: 'blur(10px)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.border}` }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, boxShadow: `0 0 8px ${c.dot}` }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#fff' }}>{node.id}</span>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: c.text, border: `1px solid ${c.border}` }}>{node.type}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{node.model}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2px 8px' }}>#{index + 1}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: node.tools?.length ? 12 : 0 }}>{node.prompt_template}</p>
        {node.tools?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {node.tools.map((t, i) => (
              <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 5 }}>
                🔧 {t.name}
                {t.sandbox && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />}
              </span>
            ))}
          </div>
        )}
      </div>
      {index < total - 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
          <div style={{ width: 1, height: 16, background: 'linear-gradient(to bottom, rgba(139,92,246,0.5), rgba(139,92,246,0.1))' }} />
          <div style={{ color: 'rgba(139,92,246,0.6)', fontSize: 12 }}>↓</div>
        </div>
      )}
    </div>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{ padding: '8px 16px', borderRadius: 12, background: color.bg, border: `1px solid ${color.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color.text }}>{value}</span>
    </div>
  )
}

function AgentResult({ config, onSave, onCopy }) {
  const safety = SAFETY_COLORS[config.safety_level] || SAFETY_COLORS.medium
  const [saved, setSaved] = useState(false)
  const handleSave = async () => { await onSave(); setSaved(true) }
  return (
    <div style={{ marginTop: 24, animation: 'fadeInUp 0.5s ease' }}>
      {/* Header card */}
      <div style={{ borderRadius: 20, padding: 28, marginBottom: 16, background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(219,39,119,0.08) 50%, rgba(14,165,233,0.08) 100%)', border: '1px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, color: '#34d399', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600 }}>Agent généré avec succès</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{config.name}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 20, maxWidth: 600 }}>{config.description}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <StatBadge label="Sécurité" value={config.safety_level?.toUpperCase()} color={safety} />
          <StatBadge label="Mémoire" value={config.memory_type} color={{ bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc' }} />
          <StatBadge label="Coût estimé" value={`~$${config.estimated_cost_usd_month?.toFixed(2)}/mois`} color={{ bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' }} />
          <StatBadge label="Nœuds" value={`${config.nodes?.length} nœuds`} color={{ bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.3)', text: '#7dd3fc' }} />
        </div>
      </div>

      {/* Graph */}
      <div style={{ borderRadius: 20, padding: 24, marginBottom: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2 }}>Graphe LangGraph</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 11, color: 'rgba(139,92,246,0.8)', fontFamily: 'monospace' }}>entry: {config.entry_point}</span>
        </div>
        {config.nodes?.map((n, i) => <NodeCard key={n.id} node={n} index={i} total={config.nodes.length} />)}
      </div>

      {/* Edges */}
      {config.edges?.length > 0 && (
        <div style={{ borderRadius: 20, padding: 20, marginBottom: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Connexions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {config.edges.map(([a, b], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 12 }}>
                <span style={{ color: '#a78bfa' }}>{a}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                <span style={{ color: '#67e8f9' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onCopy} style={{ flex: 1, minWidth: 140, padding: '14px 20px', borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >📋 Copier le JSON</button>
        <button onClick={handleSave} style={{ flex: 2, minWidth: 200, padding: '14px 20px', borderRadius: 14, cursor: 'pointer', background: saved ? 'linear-gradient(135deg, #059669, #0d9488)' : 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'all 0.3s', boxShadow: saved ? '0 4px 20px rgba(5,150,105,0.4)' : '0 4px 20px rgba(124,58,237,0.4)' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >{saved ? '✅ Agent sauvegardé !' : '💾 Sauvegarder l\'agent'}</button>
      </div>
    </div>
  )
}

function SavedList({ agents, onDelete, onView }) {
  if (!agents.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 15 }}>Aucun agent sauvegardé</p>
      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13, marginTop: 8 }}>Génère ton premier agent dans l'onglet "Créer"</p>
    </div>
  )
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {agents.map(a => {
        const safety = SAFETY_COLORS[a.safety_level] || SAFETY_COLORS.medium
        return (
          <div key={a.id} onClick={() => onView(a)} style={{ borderRadius: 16, padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', flex: 1, marginRight: 8 }}>{a.name}</h4>
              <button onClick={e => { e.stopPropagation(); onDelete(a.id) }} style={{ padding: '3px 10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 11, flexShrink: 0 }}>Suppr.</button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.description}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: safety.bg, border: `1px solid ${safety.border}`, color: safety.text }}>{a.safety_level}</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>{a.nodes?.length} nœuds</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}>~${a.estimated_cost_usd_month?.toFixed(2)}/mois</span>
            </div>
          </div>
        )
      })}
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
  const [charCount, setCharCount] = useState(0)
  const resultRef = useRef(null)

  useEffect(() => { loadAgents() }, [])
  useEffect(() => { setCharCount(intent.length) }, [intent])

 async function handleCheckout(plan) {
  try {
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    })
    const d = await r.json()
    if (d.url) window.location.href = d.url
    else toast.error('Erreur paiement')
  } catch { toast.error('Erreur réseau') }
}
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
      const r = await fetch('/api/agents/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_intent: intent }) })
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
    try { await fetch(`/api/agents/${id}`, { method: 'DELETE' }); toast.success('Supprimé.'); loadAgents() }
    catch { toast.error('Suppression impossible.') }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070711', color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        * { box-sizing:border-box; margin:0; padding:0 }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:2px }
        textarea:focus { outline:none !important }
      `}</style>

      {/* Animated background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(219,39,119,0.1) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', top: '40%', left: '40%', width: '30%', height: '30%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 12s ease-in-out infinite' }} />
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,7,17,0.8)', backdropFilter: 'blur(30px)', padding: '0 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>🤖</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.5, background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MetaAgent</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, textTransform: 'uppercase' }}>AI Agent Builder</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 500 }}>Claude Sonnet 4.5</span>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {agents.length} agent{agents.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px', position: 'relative', zIndex: 1 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56, animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', marginBottom: 28 }}>
            <span style={{ fontSize: 12 }}>✦</span>
            <span style={{ fontSize: 12, color: 'rgba(196,181,253,0.9)', fontWeight: 500 }}>Génération d'agents IA · LangGraph · Claude Sonnet 4.5</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 20 }}>
            <span style={{ display: 'block', color: '#fff' }}>Décris ton agent.</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #67e8f9 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 4s linear infinite' }}>On construit le graphe.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
            Tape une intention en français. Le meta-agent génère un AgentConfig LangGraph complet avec nœuds, outils, mémoire et coût estimé.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 32 }}>
          {[{ key: 'create', icon: '✦', label: 'Créer un agent' }, { key: 'library', icon: '🗂', label: `Bibliothèque · ${agents.length}` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '12px 0', borderRadius: 13, cursor: 'pointer', background: tab === t.key ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(219,39,119,0.2))' : 'transparent', border: tab === t.key ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: tab === t.key ? 600 : 400, transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Créer */}
        {tab === 'create' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(219,39,119,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💬</div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Décris ton agent</h2>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={intent}
                  onChange={e => setIntent(e.target.value)}
                  disabled={loading}
                  rows={5}
                  placeholder="Ex : Un agent qui lit mes emails Gmail chaque matin, détecte les demandes clients urgentes et poste un résumé dans Slack #urgent..."
                  style={{ width: '100%', padding: '16px 18px', paddingBottom: 40, borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 11, color: charCount > 5500 ? '#fca5a5' : 'rgba(255,255,255,0.2)' }}>{charCount}/6000</span>
              </div>

              {/* Exemples */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0 24px' }}>
                {EXEMPLES.map((ex, i) => (
                  <button key={i} onClick={() => setIntent(ex)} disabled={loading} style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = '#c4b5fd' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                  >💡 {ex.substring(0, 45)}…</button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  Pare-feu sémantique actif
                </div>
                <button onClick={handleGenerate} disabled={loading || intent.trim().length < 10} style={{ padding: '14px 32px', borderRadius: 14, cursor: loading || intent.trim().length < 10 ? 'not-allowed' : 'pointer', background: loading || intent.trim().length < 10 ? 'rgba(124,58,237,0.2)' : 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, opacity: intent.trim().length < 10 ? 0.5 : 1, boxShadow: intent.trim().length >= 10 ? '0 4px 24px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.3s' }}
                  onMouseEnter={e => { if (intent.trim().length >= 10 && !loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {loading ? (
                    <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Génération en cours…</>
                  ) : <><span>✦</span> Générer l'agent</>}
                </button>
              </div>
            </div>

            {/* Loader */}
            {loading && (
              <div style={{ marginTop: 20, borderRadius: 24, padding: '48px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.2)', textAlign: 'center', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ fontSize: 48, marginBottom: 20, animation: 'float 2s ease-in-out infinite' }}>🧠</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                  {['Analyse intention', 'Sélection outils', 'Génération graphe', 'Validation'].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: `pulse ${1 + i * 0.3}s infinite` }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && !loading && (
              <div style={{ marginTop: 20, borderRadius: 16, padding: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 6 }}>⚠️ {error.error}</div>
                <div style={{ fontSize: 13, color: 'rgba(252,165,165,0.7)' }}>{error.reason}</div>
              </div>
            )}

            <div ref={resultRef}>
              {result && !result.error && !loading && (
                <AgentResult config={result} onSave={handleSave} onCopy={() => { navigator.clipboard.writeText(JSON.stringify(result, null, 2)); toast.success('JSON copié !') }} />
              )}
            </div>
          </div>
        )}

        {/* Bibliothèque */}
        {tab === 'library' && (
          <div style={{ borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(14,165,233,0.4), rgba(99,102,241,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗂</div>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Agents sauvegardés</h2>
            </div>
            <SavedList agents={agents} onDelete={handleDelete} onView={a => { setResult(a); setTab('create'); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }} />
          </div>
        )}
     {/* Pricing */}
<div style={{ marginTop: 60, borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
  <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choisir un plan</h2>
  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Commence gratuitement, upgrade quand tu es prêt</p>
  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
    {[
      { key: 'starter',  name: 'Starter',  price: '29€',  agents: '3 agents',  color: '#6366f1' },
      { key: 'pro',      name: 'Pro',       price: '89€',  agents: '20 agents', color: '#7c3aed', popular: true },
      { key: 'business', name: 'Business',  price: '299€', agents: 'Illimité',  color: '#db2777' },
    ].map(plan => (
      <div key={plan.key} style={{ borderRadius: 20, padding: 28, background: plan.popular ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(219,39,119,0.1))' : 'rgba(255,255,255,0.02)', border: `1px solid ${plan.popular ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`, position: 'relative', textAlign: 'center' }}>
        {plan.popular && (
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
            ⭐ POPULAIRE
          </div>
        )}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
        <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4, color: plan.color }}>{plan.price}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>/mois · {plan.agents}</div>
        <button
          onClick={() => handleCheckout(plan.key)}
          style={{ width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer', background: plan.popular ? 'linear-gradient(135deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.08)', border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Commencer →
        </button>
      </div>
    ))}
  </div>
</div>
{/* Section Pricing toujours visible */}
<div style={{ marginTop: 60, borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
 </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>MetaAgent · AgentConfig v2 · Claude Sonnet 4.5 · LangGraph compatible</p>
      </footer>
    </div>
  )
}
