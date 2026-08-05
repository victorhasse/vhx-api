<div align="center">

<img width="200" height="200" alt="Logo da VHX Store" src="https://github.com/user-attachments/assets/3b896291-a76e-4e08-a7ad-8d2b93f4cfc9" />

# &lt;VHX&gt; API — Backend

API REST responsável pelo e-commerce de streetwear VHX Store, desenvolvido como projeto de portfólio.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize&logoColor=white&style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white&style=flat-square)
![Stripe](https://img.shields.io/badge/Stripe-Sandbox-635BFF?logo=stripe&logoColor=white&style=flat-square)

</div>

<p align="center">
  <a href="../README.md">🇺🇸 English</a> | 🇧🇷 Português
</p>

## Links

- **API online:** [vhx-api.onrender.com/api/health](https://vhx-api.onrender.com/api/health)
- **Repositório do frontend:** [github.com/victorhasse/vhx-store](https://github.com/victorhasse/vhx-store)
- **Demonstração do frontend:** [victorhasse.github.io/vhx-store](https://victorhasse.github.io/vhx-store)

## Visão geral

A VHX API fornece toda a base de servidor da VHX Store. Ela gerencia autenticação, variantes de produtos, estoque, checkout, cotações de frete, cupons, lista de desejos, acompanhamento de pedidos e cashback.

O total do checkout é recalculado no servidor usando os valores atuais do banco de dados. O pedido e os snapshots de seus itens são criados durante o fluxo do Payment Intent, o estoque é reservado de forma transacional e os webhooks da Stripe oferecem um caminho adicional para confirmação do pagamento.

> Este é um projeto de portfólio e demonstração. Stripe e Melhor Envio devem ser configurados com credenciais de sandbox nos testes locais.

## Funcionalidades

- Autenticação JWT e autorização administrativa por perfil
- Hash de senhas com `bcryptjs`
- Gerenciamento de produtos, cores, imagens, tamanhos e variantes de estoque
- Recomendações de produtos e filtros de catálogo
- Validação e reserva transacional do estoque
- Payment Intents, confirmação, cancelamento e webhooks da Stripe
- Cotações de frete pelo Melhor Envio
- Validação, administração e registro de uso de cupons
- Lista de desejos individual por usuário
- Histórico de compras e gerenciamento administrativo de pedidos
- Transportadora, código e link de rastreamento, data de envio e data de entrega
- Saldo, liberações e histórico de transações do VHX Cash
- Liberação de cashback após o pedido ser marcado como entregue
- Migrations do Sequelize para evolução reproduzível do banco
- Testes automatizados de controllers e serviços com Vitest

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js + Express | Servidor HTTP e rotas REST |
| Sequelize | ORM, transações, models e acesso ao banco |
| PostgreSQL + Neon | Banco de dados de produção e suporte local |
| Umzug | Execução das migrations |
| JWT + bcryptjs | Autenticação, autorização e hash de senhas |
| Stripe | Processamento de pagamentos e webhooks |
| Melhor Envio | Cotações de frete |
| Vitest | Testes automatizados |
| CORS + dotenv | Origens permitidas e configurações de ambiente |

## Fluxo da compra

1. O frontend solicita opções de frete em `/api/shipping/quote`.
2. O cliente autenticado envia produtos, endereço, frete, cupom e cashback para `/api/payments/create-intent`.
3. A API valida produtos ativos, variantes, estoque, descontos e valores usando o banco de dados.
4. Dentro de uma transação, a API cria o pedido e os snapshots dos itens e reserva o estoque.
5. A Stripe cria um Payment Intent em BRL e retorna seu client secret.
6. Depois do pagamento, o frontend chama `/api/payments/confirm`; os webhooks da Stripe oferecem um caminho adicional de confirmação.
7. Um administrador pode atualizar os dados de envio e avançar o pedido no ciclo de entrega.
8. Quando o pedido é entregue, o VHX Cash elegível é liberado.

## Endpoints da API

Todas as rotas utilizam o prefixo `/api`.

### Autenticação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Cadastra um cliente |
| `POST` | `/auth/login` | Público | Autentica e retorna um JWT |
| `GET` | `/auth/me` | Autenticado | Retorna o usuário conectado |

### Produtos e catálogo

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/products` | Público | Lista e filtra produtos |
| `GET` | `/products/:id` | Público | Retorna um produto e suas opções |
| `GET` | `/products/:id/recommendations` | Público | Retorna produtos relacionados |
| `POST` | `/products` | Admin | Cria um produto |
| `PUT` | `/products/:id` | Admin | Atualiza um produto |
| `DELETE` | `/products/:id` | Admin | Exclui um produto |
| `POST` | `/products/:productId/colors` | Admin | Adiciona uma cor |
| `PUT` | `/products/:productId/colors/:colorId` | Admin | Atualiza uma cor |
| `DELETE` | `/products/:productId/colors/:colorId` | Admin | Exclui uma cor |
| `POST` | `/products/:productId/images` | Admin | Adiciona uma imagem |
| `PUT` | `/products/:productId/images/:imageId` | Admin | Atualiza uma imagem |
| `DELETE` | `/products/:productId/images/:imageId` | Admin | Exclui uma imagem |
| `POST` | `/products/:productId/variants` | Admin | Adiciona uma variante de estoque |
| `PUT` | `/products/:productId/variants/:variantId` | Admin | Atualiza uma variante |
| `DELETE` | `/products/:productId/variants/:variantId` | Admin | Exclui uma variante |

### Pagamentos e frete

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/payments/create-intent` | Autenticado | Valida o checkout, cria o pedido, reserva o estoque e cria o Payment Intent |
| `POST` | `/payments/confirm` | Autenticado | Confirma o pedido pelo status do pagamento na Stripe |
| `POST` | `/payments/cancel` | Autenticado | Cancela o fluxo de pagamento/pedido pendente |
| `POST` | `/shipping/quote` | Público | Solicita opções de frete |
| `POST` | `/webhooks/stripe` | Stripe | Recebe eventos da Stripe usando o corpo bruto da requisição |

### Pedidos

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/orders` | Autenticado | Lista os pedidos do cliente |
| `GET` | `/orders/:id` | Autenticado | Retorna um pedido do cliente |
| `GET` | `/orders/admin/all` | Admin | Lista todos os pedidos |
| `PATCH` | `/orders/admin/:id` | Admin | Atualiza status e rastreamento |

### Cupons

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/coupons/validate` | Autenticado | Valida um cupom no checkout |
| `GET` | `/coupons` | Admin | Lista cupons |
| `POST` | `/coupons` | Admin | Cria um cupom |
| `PUT` | `/coupons/:id` | Admin | Atualiza um cupom |
| `PATCH` | `/coupons/:id/status` | Admin | Ativa ou desativa um cupom |

### Lista de desejos e cashback

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/wishlist` | Autenticado | Retorna a lista de desejos do cliente |
| `POST` | `/wishlist/:productId` | Autenticado | Adiciona um produto à lista |
| `DELETE` | `/wishlist/:productId` | Autenticado | Remove um produto da lista |
| `GET` | `/cashback/balance` | Autenticado | Retorna o saldo de VHX Cash |
| `GET` | `/cashback/transactions` | Autenticado | Retorna o histórico de VHX Cash |

### Verificação de saúde

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/health` | Público | Retorna o status e a versão da API |

## Executando localmente

### Pré-requisitos

- Node.js 22+
- Banco de dados PostgreSQL
- Conta de testes da Stripe
- Conta sandbox do Melhor Envio para cotações reais

```bash
git clone https://github.com/victorhasse/vhx-api.git
cd vhx-api
npm install
cp .env.example .env
npm run dev
```

O comando de desenvolvimento aplica as migrations pendentes antes de iniciar o Nodemon. Por padrão, a API estará disponível em `http://localhost:3333`.

## Variáveis de ambiente

```env
PORT=3333
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vhx_store
DB_USER=postgres
DB_PASS=sua_senha

JWT_SECRET=substitua_por_um_segredo_longo_e_aleatorio
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_sua_chave_aqui

MELHOR_ENVIO_TOKEN=seu_token_sandbox
MELHOR_ENVIO_BASE_URL=https://sandbox.melhorenvio.com.br
MELHOR_ENVIO_USER_AGENT=nome_e_contato_da_aplicacao
STORE_POSTAL_CODE=00000000
```

Nunca envie credenciais reais ao Git. Os valores de produção devem ser configurados no serviço de hospedagem.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Executa migrations e inicia o servidor de desenvolvimento com Nodemon |
| `npm start` | Executa migrations e inicia o servidor de produção |
| `npm run migrate` | Aplica migrations pendentes do Sequelize |
| `npm test` | Executa uma vez a suíte do Vitest |
| `npm run test:watch` | Executa o Vitest em modo de observação |

## Estrutura do projeto

```text
src/
├── controllers/          # Validação das requisições e respostas HTTP
├── database/
│   ├── connection.js     # Conexão do Sequelize
│   ├── migrate.js        # Executor de migrations com Umzug
│   └── migrations/       # Alterações versionadas do banco
├── middleware/           # Autenticação e autorização administrativa
├── models/               # Models de domínio do Sequelize
├── routes/               # Definições dos endpoints REST
└── services/             # Regras de checkout, catálogo, frete, cupom e cashback
```

## Testes

A suíte atual cobre cores, imagens e variantes de produtos, checkout, filtros do catálogo, recomendações e regras de frete.

```bash
npm test
```

Provedores externos devem ser simulados ou isolados nos testes automatizados. Use credenciais de sandbox nos testes manuais de integração.

## Migrations do banco

As migrations são executadas automaticamente antes de `dev` e `start`. Atualmente elas cobrem o schema inicial, variantes, snapshots dos itens, campos de frete, cupons, rastreamento, listas de desejos e cashback.

Para executá-las manualmente:

```bash
npm run migrate
```

## Deploy

A API está hospedada no **Render** e utiliza um banco **PostgreSQL da Neon**. Configure todas as variáveis de ambiente no painel de hospedagem e aponte o frontend para a URL `/api` publicada.

A Stripe deve enviar os eventos para o endpoint publicado abaixo:

```text
https://dominio-da-sua-api.example/api/webhooks/stripe
```

## Autor

Desenvolvido por **Victor Hasse**

[![GitHub](https://img.shields.io/badge/victorhasse-181717?style=flat&logo=github)](https://github.com/victorhasse)

Projeto de portfólio — 2026

## Licença

Este projeto está licenciado sob a licença MIT.
