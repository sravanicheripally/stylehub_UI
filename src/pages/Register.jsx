import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../services/api'
import { AuthLayout } from './Login'

export default function Register({ onLogin }) {
  const [form,setForm]=useState({full_name:'',email:'',phone:'',password:''})
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  const navigate=useNavigate()
  function change(e){setForm({...form,[e.target.name]:e.target.value})}
  async function submit(e){
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.register(form)
      const data=await api.login({email:form.email,password:form.password})
      localStorage.setItem('stylehub_token',data.access_token)
      const user=await api.me()
      onLogin(user); navigate('/')
    } catch(err){setError(err.message || 'Registration failed')}
    finally{setLoading(false)}
  }
  return <AuthLayout title="Create your account." subtitle="Join StyleHub and make every outfit count."><form onSubmit={submit} className="auth-form">{error&&<div className="error">{error}</div>}<label>Full name<input name="full_name" value={form.full_name} onChange={change} required placeholder="Your name"/></label><label>Email<input name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com"/></label><label>Phone<input name="phone" value={form.phone} onChange={change} placeholder="Optional"/></label><label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength="8" placeholder="Minimum 8 characters"/></label><button className="primary-btn full" disabled={loading}>{loading?'Creating…':<>Create account <ArrowRight size={17}/></>}</button><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></form></AuthLayout>
}
