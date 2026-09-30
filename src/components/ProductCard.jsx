import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { apiMediaUrl } from '../services/api'

export default function ProductCard({ product, onAdd }) {
  const [liked, setLiked] = useState(false)
  const imageUrl = product.image_url || product.images?.[0]?.image_url
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
          {imageUrl ? <img src={apiMediaUrl(imageUrl)} alt={product.name}/> : <div className="product-placeholder" aria-hidden="true"><span>{product.name?.slice(0, 1) || '?'}</span></div>}
        </Link>
        {product.badge && <span className="badge">{product.badge}</span>}
        <button className={`heart ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}><Heart size={19} fill={liked ? 'currentColor' : 'none'}/></button>
        {onAdd && <button className="quick-add" disabled={product.is_active === false || (product.variants?.length > 0 && product.variants[0].stock_quantity < 1)} onClick={() => onAdd({ ...product, selectedSize: product.variants?.[0]?.size || 'One size', variant_id: product.variants?.[0]?.id || null })}><ShoppingBag size={16}/> Quick add</button>}
      </div>
      <div className="product-info">
        <div className="product-meta"><span>{product.category || 'Collection'}</span><span>{product.is_active === false ? 'Unavailable' : 'In stock'}</span></div>
        <Link to={`/products/${product.id}`} className="product-name">{product.name}</Link>
        <div className="price-row"><strong>₹{Number(product.price).toLocaleString('en-IN')}</strong></div>
      </div>
    </article>
  )
}
