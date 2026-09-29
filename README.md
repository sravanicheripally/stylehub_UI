# StyleHub Frontend

A polished React/Vite frontend for the StyleHub clothing marketplace.

## Run

```bash
npm install
npm run dev
```

Open the URL shown by Vite, usually http://localhost:5173. In PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

## Deploy to Render

This repository includes a `render.yaml` Blueprint for a Render Static Site. In Render, choose **New + > Blueprint** and select this GitHub repository. The blueprint runs `npm ci && npm run build`, publishes `dist`, sets `VITE_API_BASE_URL`, and rewrites app routes to `index.html` so React Router links load directly.

After the first deploy, add the deployed frontend origin (for example, `https://stylehub-frontend.onrender.com`) to the backend's CORS allowed origins. Use the exact Render URL shown for the frontend, and add any custom domain separately. The backend must allow that HTTPS origin for credentialed requests. The frontend environment variable is embedded at build time, so trigger a new deploy after changing it.

The backend URL must include the API prefix: `https://stylehub-backend-gu04.onrender.com/api/v1`.

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
- POST /admin/users (admin user creation; available after the backend route is deployed)
- GET /categories
- POST /categories (admin)
- GET /products
- POST /products (seller)
- POST /products/{id}/images (seller or admin; multipart `files`, up to 5 images, 5 MiB each)
- GET /products/{id}
- PUT /products/{id}
- DELETE /products/{id}

`GET /auth/me` must return a `role` field (`customer`, `seller`, or `admin`) for role-specific landing pages. The admin workspace can add categories, create customer/seller/admin accounts through `POST /admin/users`, and review live catalog counts. The seller workspace can create products with a category, price, and optional size/color/stock variant.

The first admin must be bootstrapped outside the admin-only user-creation screen: provision one trusted admin through a one-time backend seed/CLI command or a protected first-admin bootstrap process, then sign in and create additional accounts from the workspace. Do not make ordinary user registration accept an admin role or leave an unauthenticated admin-creation endpoint enabled. The deployed Render API must be updated to include `/api/v1/admin/users`; it is not present in the current hosted OpenAPI route list yet.

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
