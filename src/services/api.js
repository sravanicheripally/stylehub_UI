const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://stylehub-backend-gu04.onrender.com/api/v1'
const PAYMENT_API_BASE = import.meta.env.VITE_PAYMENT_API_BASE_URL || API_BASE
async function request(path, options = {}, base = API_BASE, includeAuth = true) {
  const token = includeAuth ? localStorage.getItem('stylehub_token') : null
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${base}${path}`, { ...options, headers })
  if (!response.ok) {
    let detail = 'Something went wrong'
    try {
      const data = await response.json()
      detail = data.detail || detail
    } catch {}
    const error = new Error(detail)
    error.status = response.status
    throw error
  }
  return response.status === 204 ? null : response.json()
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  createAdminUser: (body) => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  myOrders: ({ page=1, page_size=20 } = {}) => {
    const params = new URLSearchParams({ page, page_size })
    return request(`/orders/history?${params.toString()}`)
  },
  orders: ({ page=1, page_size=100 } = {}) => {
    const params = new URLSearchParams({ page, page_size })
    return request(`/orders?${params.toString()}`)
  },
  orderSummary: () => request('/orders/summary'),
  createPaymentOrder: (amount, currency = 'INR') => request('/payments/order', {
    method: 'POST',
    body: JSON.stringify({ amount, currency })
  }, PAYMENT_API_BASE, false),
  verifyPayment: (body) => request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(body)
  }, PAYMENT_API_BASE, false),
  products: ({ search='', page=1, page_size=100 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', page)
    params.set('page_size', page_size)
    return request(`/products?${params.toString()}`)
  },
  allProducts: async ({ search='' } = {}) => {
    const pageSize = 100
    const products = []
    for (let page = 1; page <= 100; page += 1) {
      const result = await api.products({ search, page, page_size: pageSize })
      if (!Array.isArray(result)) throw new Error('The product API returned an invalid response.')
      products.push(...result)
      if (result.length < pageSize) return products
    }
    throw new Error('The product catalog exceeds the supported page limit.')
  },
  product: (id) => request(`/products/${id}`),
  uploadProductImages: (productId, files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return request(`/products/${productId}/images`, { method: 'POST', body: formData })
  },
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  categories: () => request('/categories'),
  createCategory: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) })
}

export function apiMediaUrl(path) {
  if (!path) return ''
  try { return new URL(path, API_BASE).toString() }
  catch { return path }
}
