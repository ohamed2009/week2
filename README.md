# Microservices Bootcamp — Mini E-Commerce Platform

A small e-commerce domain split into independent Node.js / Express / MongoDB
microservices. Each service owns its own database and talks to the others over
plain HTTP. `order-service` is the orchestrator: it drives a full checkout by
calling every other service in turn.

## Services

| Service                | Owner   | Port | Responsibility                                             |
| ---------------------- | ------- | ---- | ---------------------------------------------------------- |
| user-service           | Mohamed | 4001 | Register/login users, issue a token, expose profiles       |
| catalog-service        | Mohamed | 4002 | Manage products (CRUD), price/description                  |
| **order-service**      | Chakib  | 4003 | Create orders, orchestrate the checkout flow               |
| **payment-service**    | Chakib  | 4004 | Simulate payment processing for an order                   |
| inventory-service      | Brahim  | 4005 | Track stock levels, reserve/release stock                  |
| notification-service   | Brahim  | 4006 | Record/send (mocked) notifications when an order is placed |

> This repository currently contains the two services owned by Chakib
> (`order-service` and `payment-service`). The remaining services live in the
> same `services/*` layout and are merged in from their authors' branches — see
> [Merging teammates' services](#merging-teammates-services).

## Communication graph

```
Client
  |
  v
order-service --(HTTP)--> user-service          (verify user exists)
order-service --(HTTP)--> catalog-service       (fetch product + price)
order-service --(HTTP)--> inventory-service     (reserve / release stock)
order-service --(HTTP)--> payment-service       (charge, mocked)
order-service --(HTTP)--> notification-service  (notify user, best-effort)
```

## How it works

Each service is a **separate process** with its own **port** and its own
**MongoDB database**. They share nothing in memory — the only way one service
talks to another is by sending it an **HTTP request** (REST), exactly like a
browser calling a server. A service is a *server* when it is called, and a
*client* when it calls someone else.

`order-service` is the orchestrator. A single `POST /orders` runs a chain of
HTTP calls, each one recorded as an event on the order:

```
POST /orders {userId, productId, quantity}
   |
   |-- GET  user-service     /users/:id            -> verify the buyer       (USER_VERIFIED)
   |-- GET  catalog-service  /products/:id         -> read name + price      (PRODUCT_FETCHED)
   |-- POST inventory-service/inventory/reserve    -> decrement stock        (STOCK_RESERVED)
   |-- POST payment-service  /payments             -> charge price*quantity  (PAYMENT_SUCCEEDED)
   |        on failure: POST inventory/release to roll the stock back, abort 402
   |-- POST notification-service /notifications    -> best-effort notify     (NOTIFICATION_SENT)
   |
   -> save the order as CONFIRMED (201) with the full event log
```

Key rules the design enforces:

- **A downstream 404 / 409 propagates**: an unknown user or product returns
  `404`, insufficient stock returns `409`.
- **Payment failure rolls back**: the reserved stock is released, and the order
  aborts with `402`.
- **Notifications never block the order**: a failure there is logged and the
  order still confirms.
- **A dead service becomes a 503**: if a downstream is unreachable or times out,
  the orchestrator returns `503` instead of crashing.
- **Every downstream URL comes from `.env`**, so deploying is a config change,
  not a code change.

## Requirements

- Node.js v20+ (developed on v24)
- A MongoDB instance — a local `mongod` or a MongoDB Atlas free-tier cluster

## Install

This is an npm workspaces monorepo. Install every service's dependencies in one
shot from the root:

```bash
npm install
```

## Configure

Each service reads its configuration from a local `.env` file. Copy the example
and adjust the values (Mongo URI, and — for `order-service` — the base URLs of
the services it calls):

```bash
cp services/order-service/.env.example   services/order-service/.env
cp services/payment-service/.env.example services/payment-service/.env
```

Service-to-service URLs always come from `.env`; they are never hardcoded. When
the services get deployed, only the `.env` values change — no code changes.

## Run

Run both services at once from the root:

```bash
npm run dev
```

Or run a single service from its own folder:

```bash
cd services/payment-service && npm run dev
cd services/order-service   && npm run dev
```

Each service exposes `GET /health` returning `{ "status": "ok" }`.

## Error format

Every service returns errors with the same JSON shape so callers can parse them
uniformly:

```json
{ "error": true, "message": "Product not found", "statusCode": 404 }
```

## Merging teammates' services

Every service follows the exact same folder skeleton and lives under
`services/`, so integrating another author's service is a drop-in:

1. Add the author's branch as a remote / fetch their branch.
2. Their service folder (e.g. `services/user-service/`) is self-contained — it
   brings its own `package.json`, `src/`, `.env.example` and `README.md`.
3. Merge the branch; the new folder slots under `services/` next to the
   existing ones. `npm install` at the root picks up its dependencies.
4. Nothing in `order-service` changes: it already reads every downstream base
   URL from `.env`.

See [docs/](docs/) for the shared Postman collection.
