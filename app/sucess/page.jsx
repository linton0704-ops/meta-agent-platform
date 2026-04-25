export default function Success() {
  return (
    <div style={{
      minHeight: '100vh', background: '#070711',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui', color: '#fff', textAlign: 'center'
    }}>
      <div>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
          Paiement réussi !
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
          Bienvenue sur MetaAgent. Ton compte est activé.
        </p>
        <a href="/" style={{
          padding: '14px 32px', borderRadius: 14,
          background: 'linear-gradient(135deg, #7c3aed, #db2777)',
          color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15
        }}>
          Commencer à créer des agents →
        </a>
      </div>
    </div>
  )
}