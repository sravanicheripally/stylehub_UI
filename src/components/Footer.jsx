import { useEffect, useState } from 'react'
import { Instagram, Facebook, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function Footer() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.categories().then(data => { if (Array.isArray(data)) setCategories(data) }).catch(() => {})
  }, [])

  return (
    <footer id="about" className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">STYLE<span>HUB</span></div>
          <p className="muted">Modern fashion for every mood. Discover pieces designed to make everyday dressing feel effortless.</p>
          <div className="socials"><a href="#"><Instagram/></a><a href="#"><Facebook/></a><a href="mailto:hello@stylehub.com"><Mail/></a></div>
        </div>
        <div><h4>Shop</h4><Link to="/products">All products</Link>{categories.map(category => <Link to={`/products?category_id=${category.id}`} key={category.id}>{category.name}</Link>)}</div>
        <div><h4>Help</h4><a href="#">Shipping & Returns</a><a href="#">Size Guide</a><a href="#">Contact Us</a><a href="#">FAQs</a></div>
        <div><h4>Stay in the loop</h4><p className="muted">New drops, styling notes and private offers.</p><div className="newsletter"><input placeholder="Your email"/><button>Join</button></div></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 StyleHub</span><span>Built with React + FastAPI</span></div>
    </footer>
  )
}
