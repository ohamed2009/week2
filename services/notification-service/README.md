# notification-service (Brahim)

Records and "sends" (mocked via `console.log`) notifications when an order is
placed. Called by `order-service` as a best-effort, fire-and-forget step.

- **Port:** `4006`
- **Stack:** Node.js + Express + MongoDB (Mongoose)

## Run locally

```bash
cd services/notification-service
cp .env.example .env      # then edit MONGO_URI if needed
npm install
npm run dev
```

Service starts on `http://localhost:4006`.

## Environment variables

| Variable    | Example                                          | Description                 |
| ----------- | ------------------------------------------------ | --------------------------- |
| `PORT`      | `4006`                                            | Port the service listens on |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/notification-db`       | MongoDB connection string   |

## Endpoints

| Method | Endpoint                    | Body                          | Description |
| ------ | --------------------------- | ----------------------------- | ----------- |
| GET    | `/health`                   | –                             | `{ status: "ok" }` |
| POST   | `/notifications`            | `{ userId, orderId, message }` | Store + log a notification -> `201` |
| GET    | `/notifications/:userId`    | –                             | List a user's notifications (newest first) |

## Error shape (all services share this)

```json
{ "error": true, "message": "userId is required", "statusCode": 400 }
```

## Quick test (curl)

```bash
curl http://localhost:4006/health
curl -X POST http://localhost:4006/notifications -H "Content-Type: application/json" -d "{\"userId\":\"u1\",\"orderId\":\"o1\",\"message\":\"Your order is confirmed\"}"
curl http://localhost:4006/notifications/u1
```
