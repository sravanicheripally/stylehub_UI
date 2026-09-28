import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../services/api'

export default function Login({ onLogin }) {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  const navigate=useNavigate()
  async function submit(e){
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data=await api.login({email,password})
      localStorage.setItem('stylehub_token',data.access_token)
      const user=await api.me()
      onLogin(user); navigate('/')
    } catch(err){setError(err.message || 'Login failed')}
    finally{setLoading(false)}
  }
  return <AuthLayout title="Welcome back." subtitle="Sign in to continue your StyleHub journey."><form onSubmit={submit} className="auth-form">{error&&<div className="error">{error}</div>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/></label><button className="primary-btn full" disabled={loading}>{loading?'Signing in…':<>Sign in <ArrowRight size={17}/></>}</button><p className="auth-switch">New to StyleHub? <Link to="/register">Create an account</Link></p></form></AuthLayout>
}

export function AuthLayout({title,subtitle,children}){return <main className="auth-page"><div className="auth-art"><div className="auth-art-text"><p className="eyebrow light">STYLEHUB</p><h2>Wear what<br/><em>feels like you.</em></h2></div></div><div className="auth-panel"><Link to="/" className="brand auth-brand">STYLE<span>HUB</span></Link><div className="auth-inner"><p className="eyebrow">HELLO AGAIN</p><h1>{title}</h1><p className="muted">{subtitle}</p>{children}</div></div></main>}
