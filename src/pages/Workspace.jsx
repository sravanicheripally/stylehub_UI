import { useEffect, useState } from 'react'
import { ArrowRight, ClipboardList, ShieldCheck, Store, UsersRound, Plus, RefreshCw } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import './Workspace.css'
import './WorkspaceData.css'

export default function Workspace({ role }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [orderSummary, setOrderSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState('')
  const [ordersError, setOrdersError] = useState('')
  const [notice, setNotice] = useState('')
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'seller' })
  const [productForm, setProductForm] = useState({ category_id: '', name: '', description: '', price: '', size: '', color: '', stock_quantity: '0' })
  const [productImages, setProductImages] = useState([])
  const [imageValidationError, setImageValidationError] = useState('')
  const [imageInputKey, setImageInputKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const isAdmin = role === 'admin'
  const RoleIcon = role === 'admin' ? ShieldCheck : Store
  const location = useLocation()

  async function loadWorkspace() {
    setLoading(true)
    setError('')
    try {
      const [categoryData, productData] = await Promise.all([api.categories(), api.allProducts()])
      if (!Array.isArray(categoryData) || !Array.isArray(productData)) throw new Error('Invalid API response')
      setCategories(categoryData)
      setProducts(productData)
      setProductForm(current => ({ ...current, category_id: current.category_id || String(categoryData[0]?.id || '') }))
    } catch {
      setError('Workspace data could not be loaded from the StyleHub API.')
    } finally { setLoading(false) }

    setOrdersLoading(true)
    setOrdersError('')
    try {
      const [summaryData, orderData] = await Promise.all([
        api.orderSummary(),
        api.orders({ page: 1, page_size: 100 })
      ])
      if (!summaryData || !Array.isArray(orderData)) throw new Error('Invalid order API response')
      setOrderSummary(summaryData)
      setOrders(orderData)
    } catch (err) {
      setOrdersError(err.message || 'Order data could not be loaded from the StyleHub API.')
    } finally { setOrdersLoading(false) }
  }

  useEffect(() => { loadWorkspace() }, [])

  useEffect(() => {
    if (isAdmin && location.hash === '#account-access') {
      document.getElementById('account-access')?.scrollIntoView({ block: 'start' })
    }
  }, [isAdmin, location.hash])

  async function createCategory(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await api.createCategory({ name: categoryForm.name.trim(), description: categoryForm.description.trim() || null })
      setCategoryForm({ name: '', description: '' })
      setNotice('Category created.')
      await loadWorkspace()
    } catch (err) { setError(err.status === 403 ? 'The backend denied category creation. Confirm this account has the admin role in /auth/me, then sign in again after an administrator updates the role.' : err.message || 'Could not create category.') }
    finally { setSaving(false) }
  }

  async function createUser(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const createdUser = await api.createAdminUser({
        email: userForm.email.trim(),
        password: userForm.password,
        full_name: userForm.full_name.trim(),
        phone: userForm.phone.trim() || null,
        role: userForm.role
      })
      setUserForm({ email: '', password: '', full_name: '', phone: '', role: 'seller' })
      setNotice(`Created ${createdUser.role} account for ${createdUser.email}.`)
    } catch (err) {
      setError(err.status === 403
        ? 'The backend denied user creation. This action requires an admin account; confirm /auth/me returns role "admin" and sign in again.'
        : err.status === 404
          ? 'The deployed backend does not have the /api/v1/admin/users route yet. Deploy that backend endpoint before creating accounts here.'
        : err.message || 'Could not create user.')
    } finally { setSaving(false) }
  }

  async function createProduct(event) {
    event.preventDefault()
    if (imageValidationError) {
      setError(imageValidationError)
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const variants = productForm.size.trim() && productForm.color.trim() ? [{ size: productForm.size.trim(), color: productForm.color.trim(), stock_quantity: Number(productForm.stock_quantity) }] : []
      const createdProduct = await api.createProduct({ category_id: Number(productForm.category_id), name: productForm.name.trim(), description: productForm.description.trim() || null, price: Number(productForm.price), variants })
      let uploadError = ''
      if (productImages.length) {
        try { await api.uploadProductImages(createdProduct.id, productImages) }
        catch (err) { uploadError = err.message || 'Image upload failed.' }
      }
      setProductForm(current => ({ ...current, name: '', description: '', price: '', size: '', color: '', stock_quantity: '0' }))
      setProductImages([])
      setImageInputKey(key => key + 1)
      setNotice(uploadError ? `Product added, but image upload failed: ${uploadError}` : `Product added to the catalog${productImages.length ? ' with images' : ''}.`)
      await loadWorkspace()
    } catch (err) { setError(err.status === 403 ? 'The backend denied product creation. Confirm this account has the seller role in /auth/me, then sign in again after an administrator updates the role.' : err.message || 'Could not create product.') }
    finally { setSaving(false) }
  }

  function selectProductImages(event) {
    const files = [...event.target.files]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (files.length > 5) {
      setImageValidationError('Choose no more than five product images.')
      setError('Choose no more than five product images.')
      setProductImages([])
      setImageInputKey(key => key + 1)
      return
    }
    const invalidFile = files.find(file => !allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024)
    if (invalidFile) {
      const message = invalidFile.size > 5 * 1024 * 1024 ? `${invalidFile.name} is larger than 5 MiB.` : `${invalidFile.name} is not a supported JPEG, PNG, GIF, or WebP image.`
      setImageValidationError(message)
      setError(message)
      setProductImages([])
      setImageInputKey(key => key + 1)
      return
    }
    setImageValidationError('')
    setError('')
    setProductImages(files)
  }

  const title = isAdmin ? 'Manage the StyleHub catalog.' : 'Put your products in front of customers.'
  const heading = isAdmin ? 'PLATFORM ADMINISTRATION' : 'SELLER STUDIO'

  return (
    <main className={`workspace-page workspace-${role}`}>
      <section className="workspace-hero">
        <div className="workspace-hero-inner">
          <div>
            <p className="eyebrow">{heading}</p>
            <h1>{title}</h1>
            <p className="workspace-description">Live categories and products are loaded from the StyleHub API.</p>
          </div>
          <div className="workspace-role-mark" aria-label={`${role} role`}><RoleIcon size={26}/><span>{role}</span></div>
        </div>
      </section>

      <section className="workspace-operations" id="operations">
        <div className="workspace-section-heading">
          <div><p className="eyebrow">LIVE API DATA</p><h2>{isAdmin ? 'Platform overview' : 'Seller catalog'}</h2></div>
          <button className="workspace-refresh" onClick={loadWorkspace} disabled={loading || ordersLoading}><RefreshCw size={15}/>{loading || ordersLoading ? 'Refreshing' : 'Refresh'}</button>
        </div>
        {error && <div className="error catalog-error" role="alert">{error}</div>}
        {notice && <div className="workspace-notice" role="status">{notice}</div>}
        <div className="workspace-metrics">
          <div><span>{isAdmin ? 'Products in catalog' : 'Products in storefront'}</span><strong>{loading ? '—' : products.length}</strong></div>
          <div><span>Categories</span><strong>{loading ? '—' : categories.length}</strong></div>
          <div><span>Orders</span><strong>{ordersLoading ? '—' : ordersError ? '!' : orderSummary?.total_orders ?? 0}</strong></div>
          <div><span>{isAdmin ? 'Order value' : 'Your order value'}</span><strong>{ordersLoading ? '—' : ordersError ? '!' : `₹${Number(orderSummary?.total_amount || 0).toLocaleString('en-IN')}`}</strong></div>
          <Link to="/products" className="workspace-metric-link">View storefront catalog <ArrowRight size={16}/></Link>
        </div>

        <section className="workspace-orders">
          <div className="workspace-section-heading">
            <div><p className="eyebrow">ORDER ACTIVITY</p><h2>{isAdmin ? 'Recent platform orders' : 'Recent orders for your products'}</h2></div>
          </div>
          {ordersError && <div className="error catalog-error" role="alert">{ordersError}</div>}
          {ordersLoading ? <div className="loading">Loading orders…</div> : orders.length === 0 ? <div className="workspace-orders-empty">No orders to show yet.</div> : <div className="workspace-orders-list">
            {orders.map(order => <article className="workspace-order" key={order.id}>
              <div><strong>Order #{order.id}</strong><span>{new Date(order.created_at).toLocaleDateString()} · {order.items.length} item{order.items.length === 1 ? '' : 's'}</span></div>
              <div className="workspace-order-items">{order.items.map((item, index) => <span key={`${order.id}-${item.product_id}-${index}`}>{item.product_name} × {item.quantity}</span>)}</div>
              <span className={`order-status order-status-${order.status}`}>{order.status}</span>
              <strong>₹{Number(order.total_amount).toLocaleString('en-IN')}</strong>
            </article>)}
          </div>}
        </section>

        <div className="workspace-management-grid">
          {isAdmin ? <section className="workspace-form-panel">
            <p className="eyebrow">CATALOG TAXONOMY</p><h2>Add a category</h2>
            <form className="workspace-form" onSubmit={createCategory}>
              <label>Category name<input value={categoryForm.name} onChange={event => setCategoryForm({ ...categoryForm, name: event.target.value })} minLength="2" maxLength="100" required/></label>
              <label>Description<textarea value={categoryForm.description} onChange={event => setCategoryForm({ ...categoryForm, description: event.target.value })} maxLength="500" rows="3"/></label>
              <button className="primary-btn dark" disabled={saving || loading}><Plus size={16}/>{saving ? 'Saving…' : 'Create category'}</button>
            </form>
            <div className="workspace-current-list"><h3>Current categories</h3>{categories.map(category => <div key={category.id}><span>{category.name}</span><small>{category.is_active ? 'Active' : 'Inactive'}</small></div>)}</div>
          </section> : <section className="workspace-form-panel">
            <p className="eyebrow">NEW LISTING</p><h2>Add a product</h2>
            <p className="muted">The current API returns the shared storefront catalog and does not identify seller ownership.</p>
            {categories.length === 0 && !loading ? <p className="muted">An admin must create a category before products can be listed.</p> : <form className="workspace-form" onSubmit={createProduct}>
              <label>Category<select value={productForm.category_id} onChange={event => setProductForm({ ...productForm, category_id: event.target.value })} required>{categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
              <label>Product name<input value={productForm.name} onChange={event => setProductForm({ ...productForm, name: event.target.value })} minLength="2" maxLength="200" required/></label>
              <label>Description<textarea value={productForm.description} onChange={event => setProductForm({ ...productForm, description: event.target.value })} rows="3"/></label>
              <label>Price (₹)<input type="number" min="0.01" step="0.01" value={productForm.price} onChange={event => setProductForm({ ...productForm, price: event.target.value })} required/></label>
              <div className="workspace-variant-fields"><label>Size<input value={productForm.size} onChange={event => setProductForm({ ...productForm, size: event.target.value })} placeholder="Optional"/></label><label>Color<input value={productForm.color} onChange={event => setProductForm({ ...productForm, color: event.target.value })} placeholder="Optional"/></label><label>Stock<input type="number" min="0" step="1" value={productForm.stock_quantity} onChange={event => setProductForm({ ...productForm, stock_quantity: event.target.value })}/></label></div>
              <label>Product images<input key={imageInputKey} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={selectProductImages}/><span className="workspace-field-hint">Up to 5 JPEG, PNG, GIF, or WebP files · 5 MiB max per image</span></label>
              {productImages.length > 0 && <div className="workspace-selected-images" aria-live="polite">{productImages.map(file => <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}</div>}
              <button className="primary-btn dark" disabled={saving || loading}><Plus size={16}/>{saving ? 'Saving…' : 'Add product'}</button>
            </form>}
          </section>}
          {isAdmin && <section className="workspace-form-panel">
            <span id="account-access" className="workspace-anchor" />
            <p className="eyebrow">ACCOUNT ACCESS</p><h2>Create a user</h2>
            <p className="muted">Create customer, seller, or admin accounts with the role assigned by the backend.</p>
            <form className="workspace-form" onSubmit={createUser}>
              <label>Full name<input value={userForm.full_name} onChange={event => setUserForm({ ...userForm, full_name: event.target.value })} minLength="2" maxLength="150" required autoComplete="name"/></label>
              <label>Email<input type="email" value={userForm.email} onChange={event => setUserForm({ ...userForm, email: event.target.value })} required autoComplete="email"/></label>
              <label>Temporary password<input type="password" value={userForm.password} onChange={event => setUserForm({ ...userForm, password: event.target.value })} minLength="8" maxLength="128" required autoComplete="new-password"/></label>
              <label>Phone<input type="tel" value={userForm.phone} onChange={event => setUserForm({ ...userForm, phone: event.target.value })} maxLength="20" autoComplete="tel"/></label>
              <label>Role<select value={userForm.role} onChange={event => setUserForm({ ...userForm, role: event.target.value })}><option value="customer">Customer</option><option value="seller">Seller</option><option value="admin">Admin</option></select></label>
              <button className="primary-btn dark" disabled={saving}><Plus size={16}/>{saving ? 'Creating…' : 'Create account'}</button>
            </form>
          </section>}
          <section className="workspace-form-panel workspace-limitations">
            <p className="eyebrow">OPERATIONS API</p><h2>{isAdmin ? 'Admin controls' : 'Seller orders'}</h2>
            {isAdmin ? <>
              <div className="workspace-limitation"><UsersRound size={19}/><div><strong>User and seller management</strong><p>Create customer, seller, and admin accounts above. Listing, editing, and suspension still need API endpoints.</p></div></div>
              <div className="workspace-limitation"><ClipboardList size={19}/><div><strong>Order reports</strong><p>Counts and order value above cover all recorded orders. Date-range reports are not available yet.</p></div></div>
            </> : <div className="workspace-limitation"><ClipboardList size={19}/><div><strong>Order fulfillment</strong><p>Your orders and item totals are shown above. Status updates are not available in this workspace yet.</p></div></div>}
          </section>
        </div>
        <p className="workspace-access-note">Management requests are authorized by the backend using your <strong>{role}</strong> account.</p>
      </section>
    </main>
  )
}