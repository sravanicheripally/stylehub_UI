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
import Workspace from './pages/Workspace'
import { api } from './services/api'

function getUserRole(user) {
  const role = String(user?.role || user?.user_role || user?.account_type || 'customer').toLowerCase()
  if (role === 'administrator') return 'admin'
  if (role === 'merchant') return 'seller'
  return ['admin', 'seller'].includes(role) ? role : 'customer'
}

export default function App() {
  const [user,setUser]=useState(null)
  const [cart,setCart]=useState(()=>JSON.parse(localStorage.getItem('stylehub_cart')||'[]'))

  useEffect(()=>{
    const token=localStorage.getItem('stylehub_token')
    if(token) api.me().then(setUser).catch(()=>{localStorage.removeItem('stylehub_token')})
  },[])

  useEffect(()=>localStorage.setItem('stylehub_cart',JSON.stringify(cart)),[cart])

  function addToCart(product){
    setCart(prev=>{
      const index=prev.findIndex(x=>x.id===product.id && x.variant_id===product.variant_id)
      if(index>-1){const next=[...prev];next[index]={...next[index],quantity:(next[index].quantity||1)+(product.quantity||1)};return next}
      return [...prev,{...product,quantity:product.quantity||1}]
    })
  }
  function updateCart(index,quantity){setCart(prev=>prev.map((x,i)=>i===index?{...x,quantity}:x))}
  function removeCart(index){setCart(prev=>prev.filter((_,i)=>i!==index))}
  function clearCart(){setCart([])}
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
      <Route path="/cart" element={<Cart items={cart} onUpdate={updateCart} onRemove={removeCart} onClear={clearCart} user={user}/>}/>
    </Routes>
    {role === 'customer' && <Footer/>}
  </>
}
