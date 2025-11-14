'use client'
import { useState, useRef } from 'react'
export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string|null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const res = await fetch('/api/newsletter/subscribe', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email }) })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error || 'Chyba'); return }
    setMsg('Zkontrolujte e-mail – posíláme potvrzení.')
    setEmail('')
  }
  return (
    <div className="max-w-md mx-auto card p-6 space-y-4">
      <h1 className="text-xl font-bold">Odběr newsletteru</h1>
      <form ref={formRef} onSubmit={submit} className="space-y-3">
        <div><div className="label">E-mail</div><input type="email" className="input" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <button className="btn" type="submit">Přihlásit se</button>
        {msg && <div className="text-sm text-zinc-600">{msg}</div>}
      </form>
    </div>
  )
}
