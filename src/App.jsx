import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Workspace from './pages/Workspace'
import { api } from './services/api'

function getUserRole(user) {
  const role = String(user?.role || user?.user_role || user?.account_type || 'customer').toLowerCase()
  if (role === 'administrator') return 'admin'
  if (role === 'merchant') return 'seller'
  return ['admin', 'seller'].includes(role) ? role : 'customer'
}

function getCartScope(user) {
  const identity = user?.id ?? user?.user_id ?? user?.email
  return identity == null || identity === ''
    ? 'guest'
    : `user:${String(identity).trim().toLowerCase()}`
}

function readCart(scope) {
  const key = `stylehub_cart:${scope}`
  let saved = localStorage.getItem(key)
  if (saved === null && scope === 'guest') {
    saved = localStorage.getItem('stylehub_cart')
    if (saved !== null) {
      localStorage.setItem(key, saved)
      localStorage.removeItem('stylehub_cart')
    }
  }
  try {
    const cart = JSON.parse(saved || '[]')
    return Array.isArray(cart) ? cart : []
  } catch {
    localStorage.removeItem(key)
    return []
  }
}

export default function App() {
  const [user,setUser]=useState(null)
  const [authLoading,setAuthLoading]=useState(true)
  const [cartState,setCartState]=useState(()=>({scope:'guest',items:readCart('guest')}))
  const cartScope = getCartScope(user)
  const cart = cartState.scope === cartScope ? cartState.items : readCart(cartScope)

  useEffect(()=>{
    const token=localStorage.getItem('stylehub_token')
    if(token) api.me().then(setUser).catch(()=>{localStorage.removeItem('stylehub_token')}).finally(()=>setAuthLoading(false))
    else setAuthLoading(false)
  },[])

  useEffect(()=>{
    if(cartState.scope !== cartScope) setCartState({scope:cartScope,items:readCart(cartScope)})
  },[cartScope,cartState.scope])

  useEffect(()=>{
    if(cartState.scope === cartScope) localStorage.setItem(`stylehub_cart:${cartScope}`,JSON.stringify(cartState.items))
  },[cartScope,cartState])

  function updateCart(update){
    setCartState(current=>{
      const items = current.scope === cartScope ? current.items : readCart(cartScope)
      return {scope:cartScope,items:update(items)}
    })
  }

  function addToCart(product){
    updateCart(prev=>{
      const index=prev.findIndex(x=>x.id===product.id && x.variant_id===product.variant_id)
      if(index>-1){const next=[...prev];next[index]={...next[index],quantity:(next[index].quantity||1)+(product.quantity||1)};return next}
      return [...prev,{...product,quantity:product.quantity||1}]
    })
  }
  function changeCartQuantity(index,quantity){updateCart(prev=>prev.map((x,i)=>i===index?{...x,quantity}:x))}
  function removeCart(index){updateCart(prev=>prev.filter((_,i)=>i!==index))}
  function clearCart(){updateCart(()=>[])}
  function logout(){localStorage.removeItem('stylehub_token');setUser(null)}
  const role = getUserRole(user)

  return <>
    <Navbar cartCount={cart.reduce((s,x)=>s+(x.quantity||1),0)} user={user} role={role} onLogout={logout}/>
    <Routes>
      <Route path="/" element={role === 'customer' ? <Home onAdd={addToCart}/> : <Workspace role={role}/>}/>
      <Route path="/workspace" element={role === 'customer' ? <Home onAdd={addToCart}/> : <Workspace role={role}/>}/>
      <Route path="/products" element={<Products onAdd={addToCart}/>}/>
      <Route path="/products/:id" element={<ProductDetails onAdd={addToCart}/>}/>
      <Route path="/login" element={<Login onLogin={setUser}/>}/>
      <Route path="/register" element={<Register onLogin={setUser}/>}/>
      <Route path="/cart" element={<Cart items={cart} onUpdate={changeCartQuantity} onRemove={removeCart} onClear={clearCart} user={user}/>}/>
      <Route path="/orders" element={<Orders user={user} authLoading={authLoading}/>}/>
    </Routes>
    {role === 'customer' && <Footer/>}
  </>
}
