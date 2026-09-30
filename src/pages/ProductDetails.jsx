import { useEffect, useState } from 'react'
import { ArrowLeft, Heart, Plus, Minus, ShoppingBag, Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, apiMediaUrl } from '../services/api'

export default function ProductDetails({ onAdd }) {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState('Collection')
  const [size, setSize] = useState('')
  const [variantId, setVariantId] = useState(null)
  const [qty, setQty] = useState(1)
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api.product(id), api.categories()]).then(([productData, categories]) => {
      if (!active) return
      setProduct(productData)
      setCategory(categories.find(item => item.id === productData.category_id)?.name || 'Collection')
      setSize(productData.variants?.[0]?.size || 'One size')
      setVariantId(productData.variants?.[0]?.id || null)
    }).catch(() => { if (active) setError('This product could not be loaded from the StyleHub API.') })
    return () => { active = false }
  }, [id])

  const availableStock = (product?.variants || []).reduce((total, variant) => total + variant.stock_quantity, 0)
  const selectedVariant = product?.variants?.find(variant => variant.id === variantId)
  const availableColors = (product?.variants || []).filter(variant => variant.size === size)
  const imageUrl = product?.image_url || product?.images?.[0]?.image_url

  function add() {
    if (!product) return
    onAdd({...product, selectedSize: size, variant_id: variantId, quantity: qty})
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <main className="section container detail-page">
      <Link to="/products" className="back-link"><ArrowLeft size={17}/> Back to shop</Link>
      {!product && !error && <div className="loading">Loading product…</div>}
      {error && <div className="error catalog-error" role="alert">{error}</div>}
      {product && <div className="detail-grid">
        <div className="detail-image">{imageUrl ? <img src={apiMediaUrl(imageUrl)} alt={product.name}/> : <div className="product-placeholder detail-placeholder" aria-hidden="true"><span>{product.name.slice(0, 1)}</span></div>}</div>
        <div className="detail-copy">
          <div className="product-meta"><span>{category}</span><span>{product.is_active ? 'Available' : 'Unavailable'}</span></div>
          <h1>{product.name}</h1>
          <div className="detail-price">₹{Number(product.price).toLocaleString('en-IN')}</div>
          <p className="detail-description">{product.description || 'A piece from the StyleHub collection.'}</p>
          {(product.variants || []).length > 0 && <div className="detail-option"><div className="option-head"><strong>Size</strong></div><div className="sizes">{[...new Set(product.variants.map(variant => variant.size))].map(variantSize => { const option = product.variants.find(variant => variant.size === variantSize); return <button className={size === variantSize ? 'selected' : ''} disabled={option.stock_quantity < 1} onClick={() => { setSize(variantSize); setVariantId(option.id) }} key={variantSize}>{variantSize}</button> })}</div></div>}
          {availableColors.length > 1 && <div className="detail-option"><div className="option-head"><strong>Color</strong></div><div className="detail-colors">{availableColors.map(variant => <button className={variant.id === variantId ? 'selected' : ''} onClick={() => setVariantId(variant.id)} key={variant.id}>{variant.color}</button>)}</div></div>}
          <div className="buy-row"><div className="qty"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={15}/></button><span>{qty}</span><button onClick={()=>setQty(qty+1)}><Plus size={15}/></button></div><button className="primary-btn add-btn" onClick={add} disabled={!product.is_active || availableStock < 1 || Boolean(product.variants?.length && (!selectedVariant || selectedVariant.stock_quantity < qty))}>{added ? <><Check size={18}/> Added</> : <><ShoppingBag size={18}/> Add to bag</>}</button><button className={`wish-large ${liked?'liked':''}`} onClick={()=>setLiked(!liked)} aria-label="Toggle wishlist"><Heart fill={liked?'currentColor':'none'}/></button></div>
          <div className="detail-note">{selectedVariant ? `${selectedVariant.stock_quantity} in stock` : availableStock > 0 ? `${availableStock} in stock` : 'Out of stock'}</div>
        </div>
      </div>}
    </main>
  )
}
