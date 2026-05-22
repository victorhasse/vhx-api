<div align="center">

<img width="200" height="200" alt="favicon" src="https://github.com/user-attachments/assets/3b896291-a76e-4e08-a7ad-8d2b93f4cfc9" />

# &lt;VHX&gt; API — Backend

REST API for the VHX Store e-commerce, developed as a portfolio project.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-9-4479A1?logo=mysql&logoColor=white&style=flat-square)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)
![Stripe](https://img.shields.io/badge/Stripe-Sandbox-635BFF?logo=stripe&logoColor=white&style=flat-square)
</div>

<p align="center">
  🇺🇸 English | <a href="docs/README_PT.md">🇧🇷 Português</a>
</p>

## 🔗 Links

- 🚀 **Live API:** [vhx-api.onrender.com](https://vhx-api.onrender.com/api/health)
- 🌐 **Frontend Repository:** [github.com/victorhasse/vhx-store](https://github.com/victorhasse/vhx-store)

## 🛠 Tech Stack

| Technology | Usage |
|---|---|
| Node.js + Express | Server and Routing |
| Sequelize ORM | Object-Relational Mapping |
| PostgreSQL (Neon) | Production database |
| MySQL | Development database |
| JWT + bcryptjs | Auth and passwords hashing |
| Stripe | Payment processing (sandbox) |
| CORS + dotenv | Security and configs|

## 📡 Endpoints

### Authentication
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | User Registration |
| POST | `/api/auth/login` | User Login |
| GET | `/api/auth/me` | Logged-in user profile |

### Products
| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |

### Orders
| Method | Route | Description |
|---|---|---|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List user orders |
| GET | `/api/orders/:id` | Get order by ID |

### Payments
| Method | Route | Description |
|---|---|---|
| POST | `/api/payments/create-intent` | Create Stripe PaymentIntent |
| POST | `/api/payments/confirm` | Confirm order after payment |

### Health Check
| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | API Status |

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally

```bash
# Clone the repository
git clone https://github.com/victorhasse/vhx-api.git
cd vhx-api

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Run in development mode
npm run dev
```

### Environment Variables

```env
PORT=3333
FRONTEND_URL=http://localhost:5174

DB_HOST=localhost
DB_PORT=3306
DB_NAME=vhx_store
DB_USER=root
DB_PASS=your_password

JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_your_key_here
```

## 📁 Project Structure

```
src/
├── controllers/       # authController, productController, orderController, paymentController
├── database/          # Sequelize connection (MySQL + PostgreSQL)
├── middleware/        # authMiddleware, adminMiddleware
├── models/            # User, Product, Order, OrderItem
└── routes/            # auth, products, orders, payments
```

## 🌐 Deploy

The backend is hosted on **Render** (free tier) with a **Neon** (PostgreSQL) database.

## 👨‍💻 Credits

Developed by **Victor Hasse**

[![GitHub](https://img.shields.io/badge/victorhasse-181717?style=flat&logo=github)](https://github.com/victorhasse)

Portfolio project — 2026

---

## 📄 License

This project is licensed under the MIT License.
