import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, UserRound, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './ProfileMenu.css'

export default function Navbar({ cartCount = 0, user, role = 'customer', onLogout }) {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const profileRef = useRef(null)

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  function submit(e) {
    e.preventDefault()
    navigate(`/products?search=${encodeURIComponent(search)}`)
    setOpen(false)
  }

  return (
    <header className="nav-wrap">
      <div className="announcement">{role === 'customer' ? 'FREE SHIPPING ON ORDERS OVER ₹1,499 · EASY 7-DAY RETURNS' : `${role.toUpperCase()} WORKSPACE · STYLEHUB OPERATIONS`}</div>
      <nav className="navbar container">
        <button className="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
        <Link to={role === 'customer' ? '/' : '/workspace'} className="brand">STYLE<span>HUB</span></Link>
        <div className={`nav-links ${open ? 'show' : ''}`}>
          {role === 'customer' ? <>
            <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/products" onClick={() => setOpen(false)}>Shop</NavLink>
            <a href="#categories" onClick={() => setOpen(false)}>Collections</a>
            <a href="#about" onClick={() => setOpen(false)}>About</a>
          </> : <>
            <NavLink to="/workspace" onClick={() => setOpen(false)}>Overview</NavLink>
            <NavLink to="/products" onClick={() => setOpen(false)}>Catalog preview</NavLink>
            <a href="/workspace#operations" onClick={() => setOpen(false)}>Operations</a>
          </>}
        </div>
        {role === 'customer' && <form className="nav-search" onSubmit={submit}>
          <Search size={18}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search styles..." />
        </form>}
        <div className="nav-actions">
          {user ? <div className="profile-menu" ref={profileRef}>
            <button className="icon-btn profile-trigger" title="Open profile" aria-label="Open profile" aria-expanded={profileOpen} onClick={() => setProfileOpen(value => !value)}><UserRound size={20}/></button>
            {profileOpen && <section className="profile-panel" aria-label="Account profile">
              <div className="profile-panel-heading"><div className="profile-avatar"><UserRound size={20}/></div><div><strong>{user.full_name || 'StyleHub user'}</strong><span>{user.role || role}</span></div><button className="profile-close" aria-label="Close profile" onClick={() => setProfileOpen(false)}><X size={16}/></button></div>
              <dl className="profile-details">
                <div><dt>Email</dt><dd>{user.email || 'Not provided'}</dd></div>
                <div><dt>Phone</dt><dd>{user.phone || 'Not provided'}</dd></div>
                <div><dt>Account status</dt><dd>{user.is_active === false ? 'Inactive' : 'Active'}</dd></div>
                {user.id != null && <div><dt>Account ID</dt><dd>{user.id}</dd></div>}
              </dl>
              <div className="profile-panel-actions">
                {role !== 'customer' && <Link to="/workspace" onClick={() => setProfileOpen(false)}><LayoutDashboard size={16}/> Open workspace</Link>}
                <button onClick={() => { setProfileOpen(false); onLogout() }}><LogOut size={16}/> Sign out</button>
              </div>
            </section>}
          </div> : <Link className="login-link" to="/login">Login</Link>}
          {role === 'customer' && <Link className="bag-btn" to="/cart"><ShoppingBag size={20}/><span>{cartCount}</span></Link>}
        </div>
      </nav>
    </header>
  )
}
