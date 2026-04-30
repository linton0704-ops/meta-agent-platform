'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const BUSINESS_TEMPLATES = [
  {
    title: 'Agent Restaurant',
    icon: '🍕',
    description: 'Réservations, menus & avis clients automatisés',
    preset: "Je veux un agent pour mon restaurant qui répond automatiquement aux emails de réservation, confirme les tables disponibles dans mon agenda, envoie des rappels aux clients la veille et gère les annulations. Il doit aussi répondre aux questions fréquentes sur le menu et les horaires d'ouverture.",
  },
  {
    title: 'Agent Immobilier',
    icon: '🏠',
    description: 'Qualifie les prospects et planifie les visites',
    preset: "Je veux un agent pour mon agence immobilière qui répond aux demandes d'information sur les biens, qualifie automatiquement les prospects (budget, projet, délai), planifie les visites dans mon calendrier et envoie des alertes pour les nouveaux biens correspondant à leurs critères.",
  },
  {
    title: 'Agent Coiffeur',
    icon: '✂️',
    description: 'Réservations de créneaux et rappels clients',
    preset: "Je veux un agent pour mon salon de coiffure qui gère les prises de rendez-vous par SMS et email, envoie des rappels automatiques 24h avant, propose des créneaux disponibles et relance les clients qui n'ont pas repris rendez-vous depuis 2 mois.",
  },
  {
    title: 'Agent Freelance',
    icon: '💼',
    description: 'Emails clients, devis et relances automatiques',
    preset: "Je veux un agent freelance qui trie mes emails par urgence (client bloqué, nouveau projet, facturation), rédige des réponses professionnelles en mon nom, génère des devis à partir de mes tarifs et relance automatiquement les factures impayées.",
  },
  {
    title: 'Agent E-commerce',
    icon: '🛍️',
    description: 'SAV, remboursements et suivi commandes',
    preset: "Je veux un agent e-commerce qui répond aux questions clients sur les commandes, gère les demandes de remboursement et retour, envoie des mises à jour de livraison proactives et détecte les avis négatifs pour les traiter en priorité.",
  },
  {
    title: 'Agent RH',
    icon: '👥',
    description: 'Tri des CV et gestion des candidatures',
    preset: "Je veux un agent RH qui analyse les CVs reçus par email, les score selon mes critères (expérience, compétences, localisation), envoie des accusés de réception personnalisés, planifie les entretiens et notifie les candidats non retenus.",
  },
  {
    title: 'Agent Avocat',
    icon: '⚖️',
    description: 'Premier contact clients et qualification dossiers',
    preset: "Je veux un agent pour mon cabinet d'avocats qui répond aux premières demandes de contact, qualifie le type de dossier (divorce, droit du travail, immobilier), collecte les informations essentielles, fixe des rendez-vous de consultation et envoie des questionnaires préparatoires.",
  },
  {
    title: 'Agent Salle de Sport',
    icon: '🏋️',
    description: 'Abonnements, cours et suivi des membres',
    preset: "Je veux un agent pour ma salle de sport qui gère les inscriptions aux cours collectifs, envoie des rappels de séances, relance les membres inactifs depuis plus de 2 semaines, répond aux questions sur les horaires et abonnements et collecte les feedbacks après les sessions.",
  },
  {
    title: 'Agent Coach',
    icon: '🎯',
    description: 'Séances, exercices et rapports de progression',
    preset: "Je veux un agent pour mon activité de coaching qui planifie les séances avec mes clients, envoie des exercices et contenus personnalisés entre les sessions, collecte leurs progrès et humeur chaque semaine et génère des rapports de progression mensuels.",
  },
  {
    title: 'Agent Artisan',
    icon: '🔨',
    description: 'Devis, planning chantiers et suivi facturation',
    preset: "Je veux un agent pour mon activité artisanale qui répond aux demandes de devis par email, planifie les visites de chantier dans mon agenda, envoie des mises à jour d'avancement aux clients, génère des factures et relance les paiements en retard.",
  },
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
      <div style={{ border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 20px 20px 24px', background: c.bg, backdropFilter: 'blur(10px)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.border}` }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, boxShadow: `0 0 8px ${c.dot}` }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#fff' }}>{node.id}</span>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: c.text, border: `1px solid ${c.border}` }}>
              {node.type === 'llm' ? '🧠 IA' : node.type === 'tool' ? '🔧 Outil' : node.type === 'router' ? '🔀 Routeur' : '👤 Humain'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2px 8px' }}>#{index + 1}</span>
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

// ─── Log colors ─────────────────────────────────────────────────────────────
const LOG_COLORS = {
  llm:     '#c4b5fd',
  tool:    '#7dd3fc',
  success: '#6ee7b7',
  warning: '#fcd34d',
  error:   '#fca5a5',
  info:    'rgba(255,255,255,0.55)',
}

function AgentRunner({ agent, onClose }) {
  const [prompt,      setPrompt]      = useState('')
  const [logs,        setLogs]        = useState([])
  const [running,     setRunning]     = useState(false)
  const [finalAnswer, setFinalAnswer] = useState(null)
  const [runError,    setRunError]    = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const logsEndRef = useRef(null)
  const totalSteps = agent?.nodes?.length || 1

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  async function handleRun() {
    if (!prompt.trim() || running) return
    setRunning(true)
    setLogs([])
    setFinalAnswer(null)
    setRunError(null)
    setCurrentStep(0)

    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, prompt: prompt.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Erreur serveur ${res.status}`)
      }

      const reader = res.body.getReader()
      const dec    = new TextDecoder()
      let   buf    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const parts = buf.split('\n')
        buf = parts.pop()
        for (const line of parts) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === 'step')  setCurrentStep(ev.step)
            if (ev.type === 'done')  { setFinalAnswer(ev.finalAnswer); setCurrentStep(totalSteps) }
            if (ev.type === 'error') setRunError(ev.message)
            else setLogs(p => [...p, ev])
          } catch {}
        }
      }
    } catch (e) {
      setRunError(e.message)
    } finally {
      setRunning(false)
    }
  }

  function renderLogEntry(ev, i) {
    if (ev.type === 'start') return (
      <div key={i} style={{ color: '#a78bfa', paddingBottom: 10, marginBottom: 6, borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
        ━━ Agent «{ev.agentName}» · {ev.nodeCount} nœud{ev.nodeCount > 1 ? 's' : ''} ━━
      </div>
    )
    if (ev.type === 'step') return (
      <div key={i} style={{ color: '#67e8f9', marginTop: 12, marginBottom: 4, paddingTop: 10, borderTop: '1px solid rgba(103,232,249,0.1)' }}>
        ┌ Étape {ev.step}/{ev.total} · <span style={{ fontWeight: 700 }}>{ev.nodeId}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>[{ev.nodeType}]</span>
      </div>
    )
    if (ev.type === 'log') return (
      <div key={i} style={{ color: LOG_COLORS[ev.level] || LOG_COLORS.info, paddingLeft: 14, padding: '2px 0 2px 14px', lineHeight: 1.6 }}>
        {ev.message}
      </div>
    )
    if (ev.type === 'llm_response') return (
      <div key={i} style={{ margin: '8px 0', padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
        <span style={{ display: 'block', color: '#a78bfa', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>◈ {ev.nodeId}</span>
        <span style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
          {ev.response.length > 320 ? ev.response.slice(0, 320) + '…' : ev.response}
        </span>
      </div>
    )
    if (ev.type === 'tool_result') return (
      <div key={i} style={{ margin: '8px 0', padding: '10px 14px', borderRadius: 10, background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.18)' }}>
        <span style={{ display: 'block', color: '#7dd3fc', marginBottom: 6 }}>{ev.emoji} {ev.tool} → réponse reçue</span>
        <pre style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, overflow: 'hidden', maxHeight: 56, margin: 0 }}>
          {JSON.stringify(ev.result, null, 2).slice(0, 220)}
        </pre>
      </div>
    )
    if (ev.type === 'done') return (
      <div key={i} style={{ color: '#34d399', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(52,211,153,0.15)' }}>
        ✓ Exécution terminée en {ev.duration}s
      </div>
    )
    return null
  }

  const progressPct = totalSteps > 0 ? Math.min(100, (currentStep / totalSteps) * 100) : 0

  return (
    <div style={{ marginTop: 24, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', animation: 'fadeInUp 0.4s ease' }}>

      {/* ── Terminal chrome header ── */}
      <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            meta-agent-runner — <span style={{ color: 'rgba(255,255,255,0.7)' }}>{agent.name}</span>
          </span>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >×</button>
      </div>

      {/* ── Input area ── */}
      <div style={{ padding: '20px 20px 16px', background: 'rgba(0,0,0,0.45)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Requête de test
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={running}
          rows={3}
          placeholder={`Ex : "Voici un email client : 'Bonjour, je souhaite réserver une table pour 4 personnes samedi soir à 20h…'"`}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: '#fff', fontSize: 13, lineHeight: 1.65, resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
          onBlur={e => e.target.style.borderColor  = 'rgba(255,255,255,0.07)'}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun() }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Ctrl+Entrée pour lancer</span>
          <button onClick={handleRun} disabled={running || !prompt.trim()}
            style={{ padding: '10px 24px', borderRadius: 12, cursor: running || !prompt.trim() ? 'not-allowed' : 'pointer', background: running || !prompt.trim() ? 'rgba(124,58,237,0.2)' : 'linear-gradient(135deg, #7c3aed, #0891b2)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: !prompt.trim() ? 0.5 : 1, transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!running && prompt.trim()) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {running
              ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Exécution en cours…</>
              : <><span>▶</span> Lancer l'exécution</>
            }
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {(running || logs.length > 0) && (
        <div style={{ height: 3, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #7c3aed, #0891b2)', transition: 'width 0.6s ease', boxShadow: '0 0 8px rgba(124,58,237,0.6)' }} />
        </div>
      )}

      {/* ── Terminal log output ── */}
      {logs.length > 0 && (
        <div style={{ padding: '18px 20px', background: 'rgba(0,0,0,0.55)', maxHeight: 420, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}>
          {logs.map((ev, i) => renderLogEntry(ev, i))}
          {running && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
              <span style={{ animation: 'blink 1s step-end infinite', fontSize: 16 }}>▋</span>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* ── Error ── */}
      {runError && !running && (
        <div style={{ padding: '14px 20px', background: 'rgba(239,68,68,0.07)', borderTop: '1px solid rgba(239,68,68,0.2)', fontFamily: 'monospace', fontSize: 12, color: '#fca5a5' }}>
          ⚠ Erreur : {runError}
        </div>
      )}

      {/* ── Final answer ── */}
      {finalAnswer && !running && (
        <div style={{ padding: '20px', borderTop: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <span style={{ fontSize: 11, color: '#34d399', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Réponse finale de l'agent</span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{finalAnswer}</p>
        </div>
      )}
    </div>
  )
}

function AgentResult({ config, onSave, onCopy }) {
  const safety = SAFETY_COLORS[config.safety_level] || SAFETY_COLORS.medium
  const [saved,       setSaved]       = useState(false)
  const [showRunner,  setShowRunner]  = useState(false)
  const runnerRef = useRef(null)
  const handleSave = async () => { await onSave(); setSaved(true) }
  const handleOpenRunner = () => {
    setShowRunner(true)
    setTimeout(() => runnerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }
  return (
    <div style={{ marginTop: 24, animation: 'fadeInUp 0.5s ease' }}>
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
          <StatBadge label="Coût estimé" value={`~${config.estimated_cost_usd_month?.toFixed(2)}€/mois`} color={{ bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' }} />
          <StatBadge label="Nœuds" value={`${config.nodes?.length} nœuds`} color={{ bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.3)', text: '#7dd3fc' }} />
        </div>
      </div>

      <div style={{ borderRadius: 20, padding: 24, marginBottom: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2 }}>Graphe de l'agent</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 11, color: 'rgba(139,92,246,0.8)', fontFamily: 'monospace' }}>départ: {config.entry_point}</span>
        </div>
        {config.nodes?.map((n, i) => <NodeCard key={n.id} node={n} index={i} total={config.nodes.length} />)}
      </div>

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

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onCopy} style={{ flex: 1, minWidth: 140, padding: '14px 20px', borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >📋 Copier le JSON</button><button onClick={handleDeploy} style={{
  width: '100%', padding: '14px 20px', borderRadius: 14,
  cursor: 'pointer', marginTop: 8,
  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
  transition: 'all 0.2s'
}}
  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
>
  🚀 Déployer l'agent (le rendre vivant)
</button>
        <button onClick={handleSave} style={{ flex: 2, minWidth: 200, padding: '14px 20px', borderRadius: 14, cursor: 'pointer', background: saved ? 'linear-gradient(135deg, #059669, #0d9488)' : 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'all 0.3s', boxShadow: saved ? '0 4px 20px rgba(5,150,105,0.4)' : '0 4px 20px rgba(124,58,237,0.4)' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >{saved ? '✅ Agent sauvegardé !' : '💾 Sauvegarder l\'agent'}</button>
        <button onClick={handleOpenRunner} style={{ flex: 1, minWidth: 160, padding: '14px 20px', borderRadius: 14, cursor: 'pointer', background: showRunner ? 'rgba(8,145,178,0.2)' : 'rgba(8,145,178,0.08)', border: `1px solid ${showRunner ? 'rgba(8,145,178,0.5)' : 'rgba(8,145,178,0.25)'}`, color: '#67e8f9', fontSize: 14, fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = showRunner ? 'rgba(8,145,178,0.2)' : 'rgba(8,145,178,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
        ><span>▶</span> Tester l'agent</button>
      </div>

      <div ref={runnerRef}>
        {showRunner && <AgentRunner agent={config} onClose={() => setShowRunner(false)} />}
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
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}>~{a.estimated_cost_usd_month?.toFixed(2)}€/mois</span>
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
  const [freeUsed, setFreeUsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('free_generations') || '0')
    }
    return 0
  })
  const FREE_LIMIT = 2
  const resultRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => { loadAgents() }, [])
  useEffect(() => { setCharCount(intent.length) }, [intent])

  async function loadAgents() {
    try {
      const r = await fetch('/api/agents')
      const d = await r.json()
      if (Array.isArray(d)) setAgents(d)
    } catch {}
  }
async function handleDeploy() {
  if (!result) return
  try {
    toast.loading('Déploiement en cours...')
    const r = await fetch('/api/agents/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: result })
    })
    const d = await r.json()
    toast.dismiss()
    if (d.success) {
      toast.success('🚀 Agent déployé ! Il tourne maintenant 24h/24')
      window.open(d.workflow_url, '_blank')
    } else {
      toast.error('Erreur : ' + d.error)
    }
  } catch {
    toast.error('Erreur réseau')
  }
}
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

  async function handleGenerate() {
    if (intent.trim().length < 10) { toast.error('Décris ton agent en au moins 10 caractères.'); return }

    if (freeUsed >= FREE_LIMIT) {
      toast.error('Limite gratuite atteinte ! Abonnez-vous pour continuer.')
      document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setLoading(true); setError(null); setResult(null)
    try {
      const r = await fetch('/api/agents/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_intent: intent }) })
      const d = await r.json()
      if (!r.ok || d.error) { setError(d); toast.error(d.reason || d.error) }
      else {
        setResult(d)
        const newCount = freeUsed + 1
        setFreeUsed(newCount)
        localStorage.setItem('free_generations', newCount.toString())
        if (newCount >= FREE_LIMIT) {
          toast.success(`Agent généré ! Plus de générations gratuites disponibles.`)
        } else {
          toast.success(`Agent généré ! Il vous reste ${FREE_LIMIT - newCount} génération gratuite.`)
        }
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
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
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing:border-box; margin:0; padding:0 }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:2px }
        textarea:focus { outline:none !important }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(219,39,119,0.1) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <nav aria-label="Navigation principale" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,7,17,0.8)', backdropFilter: 'blur(30px)', padding: '0 24px' }}>
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
        <section aria-label="Présentation de MetaAgent" style={{ textAlign: 'center', marginBottom: 56, animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', marginBottom: 28 }}>
            <span style={{ fontSize: 12 }}>✦</span>
            <span style={{ fontSize: 12, color: 'rgba(196,181,253,0.9)', fontWeight: 500 }}>Créez votre Agent IA · LangGraph · Claude Sonnet 4.5</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 20 }}>
            <span style={{ display: 'block', color: '#fff' }}>Créez votre Agent IA sur-mesure.</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #67e8f9 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 4s linear infinite' }}>Sans coder. En 30 secondes.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
            Décris ce que tu veux automatiser — notre IA construit l'agent pour ta PME.
            <br/>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>Restaurant, e-commerce, immobilier, RH — automatisation pour toutes les PME françaises.</span>
          </p>
          {freeUsed < FREE_LIMIT && (
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <span style={{ fontSize: 12, color: '#34d399' }}>✅ {FREE_LIMIT - freeUsed} essai{FREE_LIMIT - freeUsed > 1 ? 's' : ''} gratuit{FREE_LIMIT - freeUsed > 1 ? 's' : ''} disponible{FREE_LIMIT - freeUsed > 1 ? 's' : ''}</span>
            </div>
          )}
        </section>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 32 }}>
          {[{ key: 'create', icon: '✦', label: 'Créer un agent' }, { key: 'library', icon: '🗂', label: `Bibliothèque · ${agents.length}` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '12px 0', borderRadius: 13, cursor: 'pointer', background: tab === t.key ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(219,39,119,0.2))' : 'transparent', border: tab === t.key ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: tab === t.key ? 600 : 400, transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === 'create' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>

            {/* Templates Métiers */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(219,39,119,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Templates Métiers</h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Clique sur un template pour démarrer instantanément</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {BUSINESS_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    disabled={loading}
                    onClick={() => {
                      setIntent(tpl.preset)
                      setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
                    }}
                    style={{ padding: '18px 16px', borderRadius: 16, cursor: loading ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textAlign: 'left', transition: 'all 0.22s', opacity: loading ? 0.5 : 1 }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(124,58,237,0.12)'
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)'
                      e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.18), inset 0 0 0 1px rgba(139,92,246,0.1)'
                      e.currentTarget.style.transform = 'translateY(-3px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1 }}>{tpl.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{tpl.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(219,39,119,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💬</div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Décris ton agent</h2>
              </div>
              <div style={{ position: 'relative' }} ref={textareaRef}>
                <textarea
                  value={intent}
                  onChange={e => setIntent(e.target.value)}
                  disabled={loading}
                  rows={5}
                  placeholder="Ex : Un agent qui répond automatiquement aux emails de réservation de mon restaurant et les confirme dans mon agenda..."
                  style={{ width: '100%', padding: '16px 18px', paddingBottom: 40, borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 11, color: charCount > 5500 ? '#fca5a5' : 'rgba(255,255,255,0.2)' }}>{charCount}/6000</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  Sécurisé · Données protégées
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

            {loading && (
              <div style={{ marginTop: 20, borderRadius: 24, padding: '48px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.2)', textAlign: 'center', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ fontSize: 48, marginBottom: 20, animation: 'float 2s ease-in-out infinite' }}>🧠</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                  {['Analyse de ta demande', 'Sélection des outils', 'Construction de l\'agent', 'Validation'].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: `pulse ${1 + i * 0.3}s infinite` }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

        {tab === 'library' && (
          <div style={{ borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(14,165,233,0.4), rgba(99,102,241,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗂</div>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Mes agents sauvegardés</h2>
            </div>
            <SavedList agents={agents} onDelete={handleDelete} onView={a => { setResult(a); setTab('create'); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }} />
          </div>
        )}

        {/* FAQ */}
        <section aria-label="Questions fréquentes sur MetaAgent" style={{ marginTop: 48, borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Questions fréquentes</h2>
          {[
            { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement. Tu annules en 1 clic depuis ton espace client. Aucun frais caché." },
            { q: "Je ne suis pas développeur, est-ce fait pour moi ?", a: "Absolument. Tu décris ton agent en français normal, notre IA fait tout le travail technique à ta place." },
            { q: "Mes données sont-elles protégées ?", a: "Oui. Tes agents et données sont stockés de façon sécurisée. Nous ne partageons jamais tes informations." },
            { q: "Que se passe-t-il après les 2 essais gratuits ?", a: "Tu choisis un plan adapté. Le plan Starter à 29€/mois te donne accès à 3 agents actifs." },
            { q: "Avez-vous une garantie satisfait ou remboursé ?", a: "Oui ! 14 jours satisfait ou remboursé, sans question posée. Tu ne prends aucun risque." },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 0' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#fff' }}>❓ {item.q}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>✅ {item.a}</div>
            </div>
          ))}
        </section>

        {/* Pricing */}
        <section id="pricing-section" style={{ marginTop: 48, borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choisir un plan</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Sans engagement · Annulation en 1 clic · Remboursé sous 14 jours si insatisfait</p>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {[
              { key: 'starter', name: 'Starter', price: '29€', agents: '3 agents', color: '#6366f1', features: ['3 agents actifs', '500 générations/mois', 'Support email'] },
              { key: 'pro', name: 'Pro', price: '89€', agents: '20 agents', color: '#7c3aed', popular: true, features: ['20 agents actifs', '2500 générations/mois', 'Support prioritaire', 'Accès API'] },
              { key: 'business', name: 'Business', price: '299€', agents: 'Illimité', color: '#db2777', features: ['Agents illimités', 'Générations illimitées', 'Support dédié 24/7', 'Accès API', 'Formation incluse'] },
            ].map(plan => (
              <div key={plan.key} style={{ borderRadius: 20, padding: 28, background: plan.popular ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(219,39,119,0.1))' : 'rgba(255,255,255,0.02)', border: `1px solid ${plan.popular ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`, position: 'relative', textAlign: 'center' }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>⭐ POPULAIRE</div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4, color: plan.color }}>{plan.price}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>/mois · {plan.agents}</div>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#34d399' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => handleCheckout(plan.key)} style={{ width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer', background: plan.popular ? 'linear-gradient(135deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.08)', border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >Commencer →</button>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          MetaAgent · 
          <a href="linton0704@hotmail.com" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', margin: '0 8px' }}>Contact & Support</a>
          · Satisfait ou remboursé 14 jours
        </p>
      </footer>
    </div>
  )
}