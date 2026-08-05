# notification-service (Brahim)

Records and "sends" (mocked via `console.log`) notifications when an order is
placed. It gets that "order confirmed" event from `order-service` in two ways:

- **RabbitMQ (primary path):** `order-service` publishes an `order.confirmed`
  event; this service consumes it asynchronously and persists a `Notification`.
  `order-service` no longer calls this service over HTTP for notifications.
- **`POST /notifications` (still available):** the same HTTP endpoint that
  existed before RabbitMQ. Kept for manual testing, Postman, curl, etc. — both
  paths create the exact same `Notification` document.

- **Port:** `4006`
- **Stack:** Node.js + Express + MongoDB (Mongoose) + RabbitMQ (amqplib)

## Setup

```bash
cd services/notification-service
cp .env.example .env      # then edit MONGO_URI / RABBITMQ_URL if needed
npm install
npm run dev
```

This starts **both** the HTTP server (`http://localhost:4006`) and the
RabbitMQ consumer in the same process — `npm run dev` / `npm start` is the
only command you need. You need a running MongoDB and a running RabbitMQ
broker (see the root [README](../../README.md) / [DEPLOY.md](../../docs/DEPLOY.md)
for options).

## Environment variables

| Variable            | Example                                              | Description                                              |
| -------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| `PORT`               | `4006`                                                  | Port the HTTP server listens on                            |
| `MONGO_URI`          | `mongodb://127.0.0.1:27017/notification-db`             | MongoDB connection string                                  |
| `RABBITMQ_URL`       | `amqp://localhost`                                      | RabbitMQ broker connection string                          |
| `RABBITMQ_EXCHANGE`  | `order-events`                                          | Topic exchange `order-service` publishes to (shared)       |
| `RABBITMQ_QUEUE`     | `notification-service-order-confirmed`                  | This service's own durable queue, bound to that exchange   |

## RabbitMQ: exchange, queue, routing key

| Exchange       | Type  | Queue (this service)                    | Routing key         |
| -------------- | ----- | ------------------------------------------ | -------------------- |
| `order-events` | topic | `notification-service-order-confirmed`     | `order.confirmed`    |

The queue is **durable** and bound to the exchange on startup (idempotent —
safe to run every time the service starts). Messages are only ACKed after the
`Notification` is successfully written to MongoDB; a handler failure (bad
payload, DB error) NACKs the message **without requeue**, so a permanently
malformed message is dropped instead of looping forever.

### Payload (published by order-service)

```json
{
  "orderId": "68912f...e21a",
  "userId": "u1",
  "message": "Your order 68912f...e21a has been confirmed"
}
```

Validated exactly like the HTTP body: `userId`, `orderId`, and `message` are
all required, same as `POST /notifications`.

### Consumer startup

The consumer starts automatically with `npm start` / `npm run dev` (see
`server.js` -> `startConsumer()` in `src/config/rabbitmq.js`). If RabbitMQ is
unreachable at startup, the HTTP server still starts normally — the consumer
logs the failure and retries every 5s in the background until the broker
comes back. A dropped connection mid-run reconnects the same way.

## HTTP Endpoints

| Method | Endpoint                    | Body                          | Description |
| ------ | ---------------------------- | ------------------------------ | ----------- |
| GET    | `/health`                   | –                              | `{ status: "ok" }` |
| POST   | `/notifications`            | `{ userId, orderId, message }` | Store + log a notification -> `201` (manual testing / fallback) |
| GET    | `/notifications/:userId`    | –                              | List a user's notifications (newest first) |

## Error shape (all services share this)

```json
{ "error": true, "message": "userId is required", "statusCode": 400 }
```

## Architecture

```
order-service                         notification-service
     |                                        |
     | publish "order.confirmed"              | consume queue
     v                                        v
   +--------------------------------------------+
   |     RabbitMQ exchange: order-events (topic) |
   +--------------------------------------------+
                                                |
                                    validate -> Notification.create() -> ACK
                                    (invalid/failed -> NACK, no requeue)

order-service also still exposes POST /notifications directly for manual
testing — it just isn't called by order-service's checkout flow anymore.
```

## Testing

### 1. Happy path (RabbitMQ)

```bash
# terminal 1
cd services/notification-service && npm run dev

# terminal 2 — place an order via order-service, or publish a test event
# directly with amqplib / rabbitmqadmin using routing key "order.confirmed"
# on the "order-events" exchange, payload as shown above.
```

Expect in the notification-service logs:

```
[rabbitmq] consuming queue "notification-service-order-confirmed" bound to "order-events" (order.confirmed)
[NOTIFY] (via RabbitMQ) -> user=u1 order=o1 : "Your order o1 has been confirmed"
```

Then verify it's persisted: `curl http://localhost:4006/notifications/u1`.

### 2. RabbitMQ down

Stop the broker (`service rabbitmq-server stop` or equivalent), then place an
order through `order-service`. Expected:

- `order-service`'s `POST /orders` still returns `201` — the order confirms.
- The order's `events` array contains `NOTIFICATION_PUBLISH_FAILED` instead of
  `NOTIFICATION_PUBLISHED`.
- `order-service` stays up (check `GET /health`).
- When RabbitMQ comes back, notification-service's consumer reconnects on its
  own within ~5s (watch its logs) — no restart needed. That specific missed
  order will **not** be retried (it was never published), which is the
  intended best-effort behaviour, same as the old HTTP call.

### 3. Malformed message

Publish an invalid payload (e.g. missing `userId`) directly to the
`order-events` exchange with routing key `order.confirmed`. Expected:
notification-service logs the validation error, NACKs (drops) the message,
and **keeps running** — no crash, no infinite redelivery loop.

### 4. Manual HTTP path

```bash
curl http://localhost:4006/health
curl -X POST http://localhost:4006/notifications -H "Content-Type: application/json" -d "{\"userId\":\"u1\",\"orderId\":\"o1\",\"message\":\"Your order is confirmed\"}"
curl http://localhost:4006/notifications/u1
```
