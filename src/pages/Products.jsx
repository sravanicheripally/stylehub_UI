import { useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { api } from '../services/api'

export default function Products({ onAdd }) {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState(params.get('search') || '')
  const [category, setCategory] = useState(params.get('category_id') || '')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [productData, categoryData] = await Promise.all([api.allProducts({ search }), api.categories()])
        if (!Array.isArray(productData) || !Array.isArray(categoryData)) throw new Error('The catalog response was invalid.')
        if (active) { setProducts(productData); setCategories(categoryData) }
      } catch {
        if (active) setError('Could not load the catalog from the StyleHub API. Check the backend connection and try again.')
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [search])

  const filtered = useMemo(() => {
    return products.filter(product =>
      (!category || String(product.category_id) === String(category)) &&
      (!min || Number(product.price) >= Number(min)) &&
      (!max || Number(product.price) <= Number(max))
    )
  }, [products, category, min, max])

  const productsWithCategories = useMemo(() => filtered.map(product => ({
    ...product,
    category: categories.find(item => item.id === product.category_id)?.name || 'Collection'
  })), [filtered, categories])

  function apply() {
    const next = {}
    if (search) next.search = search
    if (category) next.category_id = category
    setParams(next)
  }

  return (
    <main className="section container shop-page">
      <div className="shop-title"><div><p className="eyebrow">THE STYLEHUB SHOP</p><h1>All <em>styles.</em></h1><p className="muted">Discover pieces made for everyday confidence.</p></div><span className="result-count">{filtered.length} products</span></div>
      <div className="shop-toolbar">
        <div className="search-field"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && apply()} placeholder="Search products..." /></div>
        <select value={category} onChange={e => { setCategory(e.target.value); setParams(e.target.value ? {category_id:e.target.value} : {}) }}><option value="">All categories</option>{categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
        <div className="price-filter"><input type="number" value={min} onChange={e=>setMin(e.target.value)} placeholder="Min ₹"/><span>—</span><input type="number" value={max} onChange={e=>setMax(e.target.value)} placeholder="Max ₹"/></div>
        <button className="filter-btn" onClick={apply}><SlidersHorizontal size={17}/> Apply</button>
      </div>
      {loading && <div className="loading">Loading catalog…</div>}
      {error && <div className="error catalog-error" role="alert">{error}</div>}
      {!loading && !error && <div className="product-grid">{productsWithCategories.map(p => <ProductCard key={p.id} product={p} onAdd={onAdd}/>)}</div>}
      {!loading && !error && !filtered.length && <div className="empty"><h3>{products.length ? 'No products match those filters' : 'The catalog is empty'}</h3><p>{products.length ? 'Try another category or price range.' : 'Products added by the StyleHub team will appear here.'}</p>{(category || min || max) && <button onClick={()=>{setCategory('');setMin('');setMax('');setParams(search ? {search} : {})}}>Clear filters</button>}</div>}
    </main>
  )
}
