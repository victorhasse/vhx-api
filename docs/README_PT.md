<div align="center">

<img width="200" height="200" alt="favicon" src="https://github.com/user-attachments/assets/3b896291-a76e-4e08-a7ad-8d2b93f4cfc9" />

# &lt;VHX&gt; API — Backend

API REST do e-commerce VHX Store, desenvolvida como projeto de portfólio.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-9-4479A1?logo=mysql&logoColor=white&style=flat-square)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)
![Stripe](https://img.shields.io/badge/Stripe-Sandbox-635BFF?logo=stripe&logoColor=white&style=flat-square)
</div>

<p align="center">
  <a href="../README.md">🇺🇸 English</a> | 🇧🇷 Português
</p>

## 🔗 Links

- 🚀 **API em produção:** [vhx-api.onrender.com](https://vhx-api.onrender.com/api/health)
- 🌐 **Repositório Frontend:** [github.com/victorhasse/vhx-store](https://github.com/victorhasse/vhx-store)

## 🛠 Tech Stack

| Tecnologia | Uso |
|---|---|
| Node.js + Express | Servidor e rotas |
| Sequelize ORM | Mapeamento objeto-relacional |
| PostgreSQL (Neon) | Banco em produção |
| MySQL | Banco em desenvolvimento |
| JWT + bcryptjs | Autenticação e hash de senha |
| Stripe | Processamento de Pagamentos (sandbox) |
| CORS + dotenv | Segurança e configuração |

## 📡 Endpoints

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Perfil do usuário logado |

### Produtos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/products` | Listar produtos |
| GET | `/api/products/:id` | Buscar produto por ID |
| POST | `/api/products` | Criar produto (admin) |
| PUT | `/api/products/:id` | Atualizar produto (admin) |
| DELETE | `/api/products/:id` | Remover produto (admin) |

### Pedidos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/orders` | Criar pedido |
| GET | `/api/orders` | Listar pedidos do usuário |
| GET | `/api/orders/:id` | Pegar pedidos por ID |

### Payments
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/payments/create-intent` | Criar Stripe PaymentIntent |
| POST | `/api/payments/confirm` | Confirmar pedidos depois do pagamento |

### Health Check
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Status da API |

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18+
- MySQL 8+ rodando localmente

```bash
# Clone o repositório
git clone https://github.com/victorhasse/vhx-api.git
cd vhx-api

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Rode em desenvolvimento
npm run dev
```

### Variáveis de ambiente

```env
PORT=3333
FRONTEND_URL=http://localhost:5174

DB_HOST=localhost
DB_PORT=3306
DB_NAME=vhx_store
DB_USER=root
DB_PASS=sua_senha

JWT_SECRET=seu_secret
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_teste_sua_chave_aqui
```

## 📁 Estrutura do Projeto

```
src/
├── controllers/       # authController, productController, orderController, paymentController
├── database/          # Conexão Sequelize (MySQL + PostgreSQL)
├── middleware/        # authMiddleware, adminMiddleware
├── models/            # User, Product, Order, OrderItem
└── routes/            # auth, products, orders, payments
```

## 🌐 Deploy

O backend está hospedado no **Render** (plano gratuito) com banco de dados **Neon** (PostgreSQL).

## 👨‍💻 Créditos

Desenvolvido por **Victor Hasse**

[![GitHub](https://img.shields.io/badge/victorhasse-181717?style=flat&logo=github)](https://github.com/victorhasse)

Projeto para portfólio — 2026

---

## 📄 Licença

Este projeto está sob a licença MIT.
