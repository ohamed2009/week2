# inventory-service (Brahim)

Tracks stock levels per product and lets `order-service` **reserve** and
**release** stock during the checkout flow.

- **Port:** `4005`
- **Stack:** Node.js + Express + MongoDB (Mongoose)

## Run locally

```bash
cd services/inventory-service
cp .env.example .env      # then edit MONGO_URI if needed
npm install
npm run dev               # nodemon, auto-restarts on save
```

Service starts on `http://localhost:4005`.

## Environment variables

| Variable    | Example                                      | Description              |
| ----------- | -------------------------------------------- | ------------------------ |
| `PORT`      | `4005`                                        | Port the service listens on |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/inventory-db`      | MongoDB connection string   |

## Endpoints

| Method | Endpoint                 | Body                       | Description |
| ------ | ------------------------ | -------------------------- | ----------- |
| GET    | `/health`                | –                          | `{ status: "ok" }` |
| POST   | `/inventory`             | `{ productId, quantity }`  | Set/reset initial stock (upsert) -> `201` |
| GET    | `/inventory/:productId`  | –                          | Get current stock (`404` if none) |
| POST   | `/inventory/reserve`     | `{ productId, quantity }`  | Decrement stock. `409` if insufficient |
| POST   | `/inventory/release`     | `{ productId, quantity }`  | Increment stock back (rollback) |

## Error shape (all services share this)

```json
{ "error": true, "message": "Insufficient stock", "statusCode": 409 }
```

## Quick test (curl)

```bash
curl http://localhost:4005/health
curl -X POST http://localhost:4005/inventory -H "Content-Type: application/json" -d "{\"productId\":\"p1\",\"quantity\":10}"
curl http://localhost:4005/inventory/p1
curl -X POST http://localhost:4005/inventory/reserve -H "Content-Type: application/json" -d "{\"productId\":\"p1\",\"quantity\":3}"
curl -X POST http://localhost:4005/inventory/release -H "Content-Type: application/json" -d "{\"productId\":\"p1\",\"quantity\":1}"
```
