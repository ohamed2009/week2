# order-service

The orchestrator of the platform. Creates orders and drives the full checkout by
calling every other service over HTTP. Part of the microservices bootcamp
e-commerce platform.

- **Port:** 4003
- **Database:** `order-db`

## Endpoints

| Method | Endpoint               | Description                                    |
| ------ | ---------------------- | ---------------------------------------------- |
| POST   | `/orders`              | `{ userId, productId, quantity }` -> run the checkout flow |
| GET    | `/orders/:id`          | Get one order with its final status and events |
| GET    | `/orders/user/:userId` | List a user's orders (newest first)            |
| GET    | `/health`              | Returns `{ status: "ok" }`                     |

## Checkout flow (`POST /orders`)

The order is created as `PENDING`, then the following steps run in order. Each
step appends an entry to the order's `events` log.

1. `GET user-service /users/:userId` — 404 if the user does not exist -> abort
   `404`. Event `USER_VERIFIED`.
2. `GET catalog-service /products/:productId` — 404 if the product does not
   exist -> abort `404`. Event `PRODUCT_FETCHED`.
3. `POST inventory-service /inventory/reserve` — 409 if stock is insufficient ->
   abort `409`. Event `STOCK_RESERVED`.
4. `POST payment-service /payments` — on failure, call
   `inventory-service /inventory/release` to roll the reservation back, then
   abort `402`. Event `PAYMENT_SUCCEEDED` (or `PAYMENT_FAILED`).
5. Publish an `order.confirmed` event to RabbitMQ (`order-events` exchange) so
   `notification-service` can react asynchronously — best-effort; a failure here
   does **not** fail the order. Event `NOTIFICATION_PUBLISHED` (or
   `NOTIFICATION_PUBLISH_FAILED`).
6. Save the order as `CONFIRMED`, event `ORDER_CONFIRMED`, return `201`.

If any downstream service is unreachable or times out, the order aborts with a
`503` instead of crashing.

### Example

```bash
curl -X POST http://localhost:4003/orders \
  -H "Content-Type: application/json" \
  -d '{ "userId": "<userId>", "productId": "<productId>", "quantity": 2 }'
```

## Error format

```json
{ "error": true, "message": "Payment failed", "statusCode": 402 }
```

## Environment variables

Copy `.env.example` to `.env`. Every downstream base URL is read from here and is
never hardcoded — deploying only means swapping these values.

```
PORT=4003
MONGO_URI=mongodb://127.0.0.1:27017/order-db
USER_SERVICE_URL=http://localhost:4001
CATALOG_SERVICE_URL=http://localhost:4002
INVENTORY_SERVICE_URL=http://localhost:4005
PAYMENT_SERVICE_URL=http://localhost:4004
RABBITMQ_URL=amqp://localhost
RABBITMQ_EXCHANGE=order-events
```

## Run

```bash
npm install
npm run dev
```

> A full `POST /orders` needs user-service, catalog-service, inventory-service
> and payment-service running (HTTP), plus a reachable RabbitMQ broker for step
> 5. If RabbitMQ is down, the order still confirms — see `NOTIFICATION_PUBLISH_FAILED`
> in the event log.

## RabbitMQ

order-service only **publishes**, it never consumes. On every successful
checkout it publishes to:

| Exchange       | Type  | Routing key      |
| -------------- | ----- | ----------------- |
| `order-events` | topic | `order.confirmed` |

Payload:

```json
{ "orderId": "...", "userId": "...", "message": "Your order ... has been confirmed" }
```

The publish call is wrapped in try/catch: a broker outage is logged
(`NOTIFICATION_PUBLISH_FAILED` event) and the order still confirms. See
[`services/notification-service/README.md`](../notification-service/README.md)
for the consumer side.

## Model

`Order`: `userId`, `productId`, `quantity`, `amount`, `status`
(`PENDING`/`CONFIRMED`/`FAILED`), `events` (array of `{ type, timestamp,
payload }`), `createdAt`.
