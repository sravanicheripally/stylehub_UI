import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, PackageCheck } from 'lucide-react'
import { api } from '../services/api'
import './Orders.css'

function formatPrice(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function Orders({ user, authLoading }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.role !== 'customer') {
      navigate('/workspace', { replace: true })
      return
    }

    let active = true
    api.myOrders({ page: 1 })
      .then(result => {
        if (active) {
          setOrders(result)
          setHasMore(result.length === 20)
        }
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'Your order history could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [user, authLoading, navigate])

  async function loadMore() {
    setLoadingMore(true)
    setError('')
    try {
      const nextPage = page + 1
      const result = await api.myOrders({ page: nextPage })
      setOrders(current => [...current, ...result])
      setPage(nextPage)
      setHasMore(result.length === 20)
    } catch (requestError) {
      setError(requestError.message || 'More orders could not be loaded.')
    } finally {
      setLoadingMore(false)
    }
  }

  return <main className="section container customer-orders">
    <div className="shop-title">
      <div><p className="eyebrow">YOUR STYLEHUB ACCOUNT</p><h1>Order <em>history.</em></h1></div>
      <span className="result-count">{orders.length} orders loaded</span>
    </div>
    {error && <div className="error catalog-error" role="alert">{error}</div>}
    {loading ? <div className="loading">Loading your orders…</div> : orders.length === 0 ? <div className="empty customer-orders-empty">
      <PackageCheck size={40}/>
      <h3>No orders yet</h3>
      <p>Your purchases will appear here after payment is verified.</p>
      <Link className="primary-btn dark" to="/products">Explore the collection <ArrowRight size={17}/></Link>
    </div> : <div className="customer-order-list">
      {orders.map(order => <article className="customer-order-card" key={order.id}>
        <header>
          <div><span>ORDER #{order.id}</span><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleString()}</time></div>
          <strong className={`order-status order-status-${order.status}`}>{order.status}</strong>
        </header>
        <div className="customer-order-items">
          {order.items.map((item, index) => <div key={`${order.id}-${item.product_id}-${index}`}>
            <span>{item.product_name}{item.variant_label ? ` · ${item.variant_label}` : ''} × {item.quantity}</span>
            <strong>{formatPrice(item.line_total)}</strong>
          </div>)}
        </div>
        <footer><span>{order.items.length} item{order.items.length === 1 ? '' : 's'} · Shipping {Number(order.shipping_amount) ? formatPrice(order.shipping_amount) : 'free'}</span><strong>{formatPrice(order.total_amount)}</strong></footer>
      </article>)}
    </div>}
    {!loading && hasMore && <button className="workspace-refresh customer-orders-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more orders'}</button>}
  </main>
}
