import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, Truck, RefreshCcw, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { api } from '../services/api'

export default function Home({ onAdd }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api.categories(), api.products({ page_size: 8 })])
      .then(([categoryData, productData]) => {
        if (!Array.isArray(categoryData) || !Array.isArray(productData)) throw new Error('Invalid catalog response')
        if (active) { setCategories(categoryData); setProducts(productData) }
      })
      .catch(() => { if (active) setError('The storefront could not load catalog data from the StyleHub API.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const categoryNames = new Map(categories.map(category => [category.id, category.name]))
  const featuredProducts = products.slice(0, 4).map(product => ({
    ...product,
    category: categoryNames.get(product.category_id) || 'Collection'
  }))

  return <>
    <section className="hero">
      <div className="hero-overlay"/>
      <div className="hero-content container">
        <p className="eyebrow light"><Sparkles size={15}/> THE NEW SEASON</p>
        <h1>Dress like<br/><em>you mean it.</em></h1>
        <p className="hero-copy">Explore the latest pieces and collections available in the StyleHub catalog.</p>
        <Link to="/products" className="primary-btn">Shop the collection <ArrowRight size={18}/></Link>
      </div>
    </section>

    <section className="service-strip">
      <div><Truck/><div><strong>Free shipping</strong><span>On orders over ₹1,499</span></div></div>
      <div><RefreshCcw/><div><strong>Easy returns</strong><span>7-day hassle-free returns</span></div></div>
      <div><ShieldCheck/><div><strong>Secure checkout</strong><span>100% secure payments</span></div></div>
    </section>

    <section id="categories" className="section container">
      <div className="section-head"><div><p className="eyebrow">SHOP BY CATEGORY</p><h2>Find your <em>favourite.</em></h2></div><Link to="/products" className="text-link">View all <ArrowRight size={16}/></Link></div>
      {loading && <div className="loading">Loading categories…</div>}
      {!loading && !error && categories.length > 0 && <div className="category-grid">{categories.map(category => <Link to={`/products?category_id=${category.id}`} className="category-card category-card-live" key={category.id}><span>{category.name}</span><ArrowRight size={18}/></Link>)}</div>}
      {!loading && !error && categories.length === 0 && <div className="empty"><p>No categories are available yet.</p></div>}
    </section>

    <section className="section soft-bg">
      <div className="container">
        <div className="section-head"><div><p className="eyebrow">LATEST FROM THE CATALOG</p><h2>Available <em>now.</em></h2></div><Link to="/products" className="text-link">Shop all <ArrowRight size={16}/></Link></div>
        {loading && <div className="loading">Loading products…</div>}
        {error && <div className="error catalog-error" role="alert">{error}</div>}
        {!loading && !error && featuredProducts.length > 0 && <div className="product-grid">{featuredProducts.map(product => <ProductCard key={product.id} product={product} onAdd={onAdd}/>)}</div>}
        {!loading && !error && products.length === 0 && <div className="empty"><p>No products are available yet.</p></div>}
      </div>
    </section>
  </>
}