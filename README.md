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

## Razorpay checkout

Customer checkout requires a signed-in customer. General API requests use port 8000; Razorpay order creation and signature verification use the payment service on port 8080 (`/payments/order` and `/payments/verify`). Set `VITE_RAZORPAY_KEY_ID` to the Razorpay public key ID. Keep the Razorpay key secret and webhook secret on the payment service only. Payments display as verified after signature validation; capture confirmation still requires payment-service webhook synchronization.

## Backend integration

For local development, general API requests use port 8000 and checkout order/payment verification use port 8080 through the Vite `/payment-api` proxy. This avoids browser CORS preflight failures during local checkout:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_PAYMENT_API_BASE_URL=/payment-api
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

Copy `.env.example` to `.env` and adjust either URL if needed:

`VITE_API_BASE_URL` is also used for product images.

The Vite proxy is development-only. In production, configure the payment API to allow the deployed frontend origin through CORS and set `VITE_PAYMENT_API_BASE_URL` to its API origin.

Categories, products, product details, prices, active state, inventory variants, and uploaded product images are read from the FastAPI backend. The storefront does not substitute hardcoded demo records when the API is unavailable; it shows an error or empty state instead. Products without an uploaded image use a neutral placeholder.

Available backend endpoints used by the frontend:
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /orders (customer; call after payment verification)
- GET /orders/history (customer order history)
- GET /orders (admin; all orders, or seller; only that seller's items)
- GET /orders/summary (admin-wide or seller-scoped order counts and value)
- POST http://127.0.0.1:8080/payments/order (create a Razorpay order)
- POST http://127.0.0.1:8080/payments/verify (verify the payment signature)
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

The image upload route stores files under `/media/product-images/`; the FastAPI application must mount that directory at `/media` so returned image URLs are served. Order history and order count/value summaries are available after applying the backend order migration with `alembic upgrade head`. The backend independently verifies the Razorpay signature through its configured payment service before recording an order. Set `PAYMENT_SERVICE_URL` on the backend to the payment service base URL (it defaults to `http://127.0.0.1:8080` for local development). The admin workspace shows platform-wide orders and totals; the seller workspace is restricted to orders containing that seller's products. Order status changes, date-range reports, customer or seller management, seller-owned product lists, and category update/delete endpoints are not available yet.

## Included screens

- Home
- Product listing/search/filter
- Product details
- Login
- Registration
- Cart
- Responsive mobile navigation
- Footer/newsletter
