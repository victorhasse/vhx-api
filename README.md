<div align="center">

<img width="200" height="200" alt="VHX Store logo" src="https://github.com/user-attachments/assets/3b896291-a76e-4e08-a7ad-8d2b93f4cfc9" />

# &lt;VHX&gt; API — Backend

REST API that powers the VHX Store streetwear e-commerce portfolio project.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize&logoColor=white&style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white&style=flat-square)
![Stripe](https://img.shields.io/badge/Stripe-Sandbox-635BFF?logo=stripe&logoColor=white&style=flat-square)

</div>

<p align="center">
  🇺🇸 English | <a href="docs/README_PT.md">🇧🇷 Português</a>
</p>

## Links

- **Live API:** [vhx-api.onrender.com/api/health](https://vhx-api.onrender.com/api/health)
- **Frontend repository:** [github.com/victorhasse/vhx-store](https://github.com/victorhasse/vhx-store)
- **Frontend demo:** [victorhasse.github.io/vhx-store](https://victorhasse.github.io/vhx-store)

## Overview

VHX API provides the server-side foundation for the VHX Store. It handles authentication, product variants, inventory, checkout, shipping quotes, coupons, wishlists, order tracking, and cashback.

The checkout total is calculated again on the server using current database values. Orders and their item snapshots are created during the payment-intent flow, stock is reserved transactionally, and Stripe webhooks provide an additional payment-confirmation path.

> This is a portfolio and demonstration project. Stripe and Melhor Envio should be configured with sandbox credentials for local testing.

## Features

- JWT authentication and role-based admin authorization
- Password hashing with `bcryptjs`
- Product, color, image, size, and stock-variant management
- Product recommendations and catalog filtering
- Transactional inventory validation and reservation
- Stripe Payment Intents, confirmation, cancellation, and webhooks
- Shipping quotes through Melhor Envio
- Coupon validation, administration, and redemption tracking
- Per-user wishlist
- Order history and administrative order management
- Carrier, tracking code, tracking URL, shipping date, and delivery date
- VHX Cash balance, allocations, and transaction history
- Cashback release after an order is marked as delivered
- Sequelize migrations for reproducible database evolution
- Automated unit and service tests with Vitest

## Tech Stack

| Technology | Usage |
|---|---|
| Node.js + Express | HTTP server and REST routes |
| Sequelize | ORM, transactions, models, and database access |
| PostgreSQL + Neon | Production and local database support |
| Umzug | Database migration runner |
| JWT + bcryptjs | Authentication, authorization, and password hashing |
| Stripe | Payment processing and webhooks |
| Melhor Envio | Shipping-rate quotes |
| Vitest | Automated tests |
| CORS + dotenv | Allowed origins and environment configuration |

## Purchase Flow

1. The frontend requests shipping options from `/api/shipping/quote`.
2. An authenticated customer submits products, address, shipping, coupon, and cashback data to `/api/payments/create-intent`.
3. The API validates active products, variants, inventory, discounts, and totals using database values.
4. Inside a database transaction, the API creates the order and item snapshots and reserves inventory.
5. Stripe creates a Payment Intent in BRL and returns its client secret.
6. After payment, the frontend calls `/api/payments/confirm`; Stripe webhooks provide an additional confirmation path.
7. An administrator can update fulfillment data and move the order through its shipping lifecycle.
8. When the order is delivered, eligible VHX Cash is released.

## API Endpoints

All routes use the `/api` prefix.

### Authentication

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a customer |
| `POST` | `/auth/login` | Public | Authenticate and return a JWT |
| `GET` | `/auth/me` | Authenticated | Return the signed-in user |

### Products and Catalog

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/products` | Public | List and filter products |
| `GET` | `/products/:id` | Public | Return a product and its options |
| `GET` | `/products/:id/recommendations` | Public | Return related products |
| `POST` | `/products` | Admin | Create a product |
| `PUT` | `/products/:id` | Admin | Update a product |
| `DELETE` | `/products/:id` | Admin | Delete a product |
| `POST` | `/products/:productId/colors` | Admin | Add a color |
| `PUT` | `/products/:productId/colors/:colorId` | Admin | Update a color |
| `DELETE` | `/products/:productId/colors/:colorId` | Admin | Delete a color |
| `POST` | `/products/:productId/images` | Admin | Add an image |
| `PUT` | `/products/:productId/images/:imageId` | Admin | Update an image |
| `DELETE` | `/products/:productId/images/:imageId` | Admin | Delete an image |
| `POST` | `/products/:productId/variants` | Admin | Add a stock variant |
| `PUT` | `/products/:productId/variants/:variantId` | Admin | Update a stock variant |
| `DELETE` | `/products/:productId/variants/:variantId` | Admin | Delete a stock variant |

### Payments and Shipping

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/payments/create-intent` | Authenticated | Validate checkout, create the order, reserve stock, and create a Payment Intent |
| `POST` | `/payments/confirm` | Authenticated | Confirm an order from its Stripe payment status |
| `POST` | `/payments/cancel` | Authenticated | Cancel a pending payment/order flow |
| `POST` | `/shipping/quote` | Public | Request shipping options |
| `POST` | `/webhooks/stripe` | Stripe | Receive Stripe events using the raw request body |

### Orders

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/orders` | Authenticated | List the customer's orders |
| `GET` | `/orders/:id` | Authenticated | Return one customer order |
| `GET` | `/orders/admin/all` | Admin | List all orders |
| `PATCH` | `/orders/admin/:id` | Admin | Update status and tracking information |

### Coupons

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/coupons/validate` | Authenticated | Validate a coupon for checkout |
| `GET` | `/coupons` | Admin | List coupons |
| `POST` | `/coupons` | Admin | Create a coupon |
| `PUT` | `/coupons/:id` | Admin | Update a coupon |
| `PATCH` | `/coupons/:id/status` | Admin | Activate or deactivate a coupon |

### Wishlist and Cashback

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/wishlist` | Authenticated | Return the customer's wishlist |
| `POST` | `/wishlist/:productId` | Authenticated | Add a product to the wishlist |
| `DELETE` | `/wishlist/:productId` | Authenticated | Remove a product from the wishlist |
| `GET` | `/cashback/balance` | Authenticated | Return the VHX Cash balance |
| `GET` | `/cashback/transactions` | Authenticated | Return VHX Cash history |

### Health Check

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Return API status and version |

## Running Locally

### Prerequisites

- Node.js 22+
- PostgreSQL database
- Stripe test account
- Melhor Envio sandbox account for live shipping quotes

```bash
git clone https://github.com/victorhasse/vhx-api.git
cd vhx-api
npm install
cp .env.example .env
npm run dev
```

The development command applies pending migrations before starting Nodemon. By default, the API is available at `http://localhost:3333`.

## Environment Variables

```env
PORT=3333
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vhx_store
DB_USER=postgres
DB_PASS=your_password

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_your_key_here

MELHOR_ENVIO_TOKEN=your_sandbox_token
MELHOR_ENVIO_BASE_URL=https://sandbox.melhorenvio.com.br
MELHOR_ENVIO_USER_AGENT=your_app_name_and_contact
STORE_POSTAL_CODE=00000000
```

Never commit real credentials. Production values must be configured in the hosting provider.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run migrations and start the development server with Nodemon |
| `npm start` | Run migrations and start the production server |
| `npm run migrate` | Apply pending Sequelize migrations |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Project Structure

```text
src/
├── controllers/          # Request validation and HTTP responses
├── database/
│   ├── connection.js     # Sequelize connection
│   ├── migrate.js        # Umzug migration runner
│   └── migrations/       # Versioned database changes
├── middleware/           # Authentication and admin authorization
├── models/               # Sequelize domain models
├── routes/               # REST endpoint definitions
└── services/             # Checkout, catalog, shipping, coupon, and cashback rules
```

## Testing

The current test suite covers product colors, images, variants, checkout, catalog filtering, product recommendations, and shipping rules.

```bash
npm test
```

External providers should be mocked or isolated in automated tests. Use sandbox credentials for manual integration testing.

## Database Migrations

Migrations run automatically before `dev` and `start`. They currently cover the initial schema, product variants, order-item snapshots, shipping fields, coupons, tracking, wishlists, and cashback.

To apply them manually:

```bash
npm run migrate
```

## Deployment

The API is hosted on **Render**, backed by a **Neon PostgreSQL** database. Configure all environment variables in the hosting dashboard and point the frontend to the deployed `/api` URL.

Stripe must call the deployed endpoint below for webhook events:

```text
https://your-api-domain.example/api/webhooks/stripe
```

## Author

Developed by **Victor Hasse**

[![GitHub](https://img.shields.io/badge/victorhasse-181717?style=flat&logo=github)](https://github.com/victorhasse)

Portfolio project — 2026

## License

This project is licensed under the MIT License.
