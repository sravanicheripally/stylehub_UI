# StyleHub Frontend

A polished React/Vite frontend for the StyleHub clothing marketplace.

## Run

```bash
npm install
npm run dev
```

Open the URL shown by Vite, usually http://localhost:5173. In PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

## Backend integration

The frontend is configured for:

`http://127.0.0.1:8000/api/v1`

Copy `.env.example` to `.env` if you need a different API URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Categories, products, product details, prices, active state, inventory variants, and uploaded product images are read from the FastAPI backend. The storefront does not substitute hardcoded demo records when the API is unavailable; it shows an error or empty state instead. Products without an uploaded image use a neutral placeholder.

Available backend endpoints used by the frontend:
- POST /auth/register
- POST /auth/login
- GET /auth/me
- GET /categories
- POST /categories (admin)
- GET /products
- POST /products (seller)
- POST /products/{id}/images (seller or admin; multipart `files`, up to 5 images, 5 MiB each)
- GET /products/{id}
- PUT /products/{id}
- DELETE /products/{id}

`GET /auth/me` must return a `role` field (`customer`, `seller`, or `admin`) for role-specific landing pages. The admin workspace can add categories and review live catalog counts. The seller workspace can create products with a category, price, and optional size/color/stock variant.

The image upload route stores files under `/media/product-images/`; the FastAPI application must mount that directory at `/media` so returned image URLs are served. The backend does not expose order listing/status/reporting, customer or seller management, seller-owned product lists, or category update/delete endpoints. Those workflows require backend APIs before they can be implemented accurately. Suggested additions include an admin statistics endpoint with date filters, admin user/role management endpoints, seller-scoped product and order endpoints, and order status update operations.

## Included screens

- Home
- Product listing/search/filter
- Product details
- Login
- Registration
- Cart
- Responsive mobile navigation
- Footer/newsletter
