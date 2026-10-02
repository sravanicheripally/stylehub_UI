import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import { api, apiMediaUrl } from '../services/api'

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load secure checkout. Please try again.'))
    document.body.appendChild(script)
  })
}

function loadPendingPayment() {
  try {
    return JSON.parse(localStorage.getItem('stylehub_pending_verified_payment') || 'null')
  } catch {
    localStorage.removeItem('stylehub_pending_verified_payment')
    return null
  }
}

export default function Cart({ items, onUpdate, onRemove, onClear, user }) {
  const [paying, setPaying] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [verifiedPayment, setVerifiedPayment] = useState(loadPendingPayment)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0)
  const shipping = subtotal >= 1499 || subtotal === 0 ? 0 : 99
  const total = subtotal + shipping

  async function saveVerifiedOrder(payment) {
    localStorage.setItem('stylehub_pending_verified_payment', JSON.stringify(payment))
    setVerifiedPayment(payment)
    setSavingOrder(true)
    setError('')
    try {
      const order = await api.createOrder({
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity || 1,
          variant_id: item.variant_id || null
        })),
        expected_total: Number(total.toFixed(2)),
        payment
      })
      onClear()
      localStorage.removeItem('stylehub_pending_verified_payment')
      setVerifiedPayment(null)
      setNotice(`Payment verified and order #${order.id} placed.`)
    } catch (orderError) {
      setError(`Your payment was verified, but order history could not be saved: ${orderError.message || 'Please retry saving the order.'} Do not pay again.`)
    } finally {
      setSavingOrder(false)
      setPaying(false)
    }
  }

  async function checkout() {
    setError('')
    setNotice('')
    if (verifiedPayment) {
      await saveVerifiedOrder(verifiedPayment)
      return
    }
    if (!user) {
      setError('Sign in as a customer before checkout.')
      return
    }
    if (user.role !== 'customer') {
      setError('Checkout is available to customer accounts only.')
      return
    }
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!keyId) {
      setError('Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID and restart the app.')
      return
    }
    setPaying(true)
    try {
      await loadRazorpay()
      const result = await api.createPaymentOrder(total)
      const order = result.order
      if (!order?.id || !order.amount || !order.currency) {
        throw new Error('Payment service returned an invalid order.')
      }
      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'StyleHub',
        description: 'StyleHub order',
        order_id: order.id,
        theme: { color: '#315e4f' },
        modal: { ondismiss: () => setPaying(false) },
        handler: async payment => {
          try {
            await api.verifyPayment({
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature
            })
            await saveVerifiedOrder(payment)
          } catch (verificationError) {
            setError(`${verificationError.message || 'Payment verification failed.'} Contact support with payment ${payment.razorpay_payment_id}; do not retry payment until its status is checked.`)
            setPaying(false)
          }
        }
      })
      checkout.on('payment.failed', response => {
        setError(response.error?.description || 'Payment failed. Your cart is unchanged; you can try again.')
        setPaying(false)
      })
      checkout.open()
    } catch (checkoutError) {
      setError(checkoutError.message || 'Could not start checkout. Please try again.')
      setPaying(false)
    }
  }

  return <main className="section container cart-page">
    <div className="shop-title"><div><p className="eyebrow">YOUR SELECTION</p><h1>Shopping <em>bag.</em></h1></div><span className="result-count">{items.length} items</span></div>
    {error && <div className="error catalog-error" role="alert">{error}{!user && <> <Link to="/login">Sign in</Link></>}</div>}
    {notice && <div className="workspace-notice" role="status">{notice}</div>}
    {!items.length ? <div className="empty cart-empty"><ShoppingBag size={42}/><h3>{notice ? 'Thank you for your order' : 'Your bag is waiting'}</h3><p>{notice ? 'Your verified payment is being finalized.' : 'Find something you love and make it yours.'}</p><Link className="primary-btn dark" to="/products">Continue shopping <ArrowRight size={17}/></Link></div> : <div className="cart-grid">
      <div className="cart-items">{items.map((item, index) => {
        const image = item.image_url || item.images?.[0]?.image_url
        return <div className="cart-item" key={`${item.id}-${item.variant_id || item.selectedSize}-${index}`}>
          {image ? <img src={apiMediaUrl(image)} alt={item.name}/> : <div className="product-placeholder cart-product-placeholder"><span>{item.name?.slice(0, 1) || '?'}</span></div>}
          <div className="cart-item-info"><div className="product-meta"><span>{item.category || 'Collection'}</span></div><h3>{item.name}</h3><p>Option: {item.selectedSize || 'One size'}</p><strong>₹{Number(item.price).toLocaleString('en-IN')}</strong><div className="cart-actions"><div className="qty"><button disabled={savingOrder || Boolean(verifiedPayment)} onClick={() => onUpdate(index, Math.max(1, (item.quantity || 1) - 1))}><Minus size={14}/></button><span>{item.quantity || 1}</span><button disabled={savingOrder || Boolean(verifiedPayment)} onClick={() => onUpdate(index, (item.quantity || 1) + 1)}><Plus size={14}/></button></div><button className="remove" disabled={savingOrder || Boolean(verifiedPayment)} onClick={() => onRemove(index)}><Trash2 size={15}/> Remove</button></div></div>
        </div>
      })}</div>
      <aside className="summary"><h3>Order summary</h3><div><span>Subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div><div><span>Shipping</span><strong>{shipping ? `₹${shipping}` : 'Free'}</strong></div><hr/><div className="total"><span>Total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><button className="primary-btn full" onClick={checkout} disabled={paying || savingOrder}>{savingOrder ? 'Saving order…' : paying ? 'Preparing secure checkout…' : verifiedPayment ? 'Retry saving order' : <>Pay ₹{total.toLocaleString('en-IN')} <ArrowRight size={17}/></>}</button><p className="secure-note">Secure payment by Razorpay · 7-day returns</p></aside>
    </div>}
  </main>
}