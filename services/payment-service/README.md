# payment-service

Simulates payment processing for an order. Part of the microservices bootcamp
e-commerce platform. Called by `order-service` during checkout.

- **Port:** 4004
- **Database:** `payment-db`

## Endpoints

| Method | Endpoint        | Description                                                        |
| ------ | --------------- | ----------------------------------------------------------------- |
| POST   | `/payments`     | `{ orderId, userId, amount }` -> charge, returns `{ paymentId, status }` |
| GET    | `/payments/:id` | Get a single payment record                                       |
| GET    | `/health`       | Returns `{ status: "ok" }`                                        |

A charge always succeeds and returns `status: "SUCCESS"`, unless `amount <= 0`
(or a field is missing), which returns `400`.

### Example

```bash
curl -X POST http://localhost:4004/payments \
  -H "Content-Type: application/json" \
  -d '{ "orderId": "order123", "userId": "user123", "amount": 59.98 }'
# -> 201 { "paymentId": "...", "status": "SUCCESS" }
```

## Error format

```json
{ "error": true, "message": "amount must be a positive number", "statusCode": 400 }
```

## Environment variables

Copy `.env.example` to `.env`:

```
PORT=4004
MONGO_URI=mongodb://127.0.0.1:27017/payment-db
```

## Run

```bash
npm install
npm run dev
```

## Model

`Payment`: `orderId`, `userId`, `amount` (Number), `status`, `createdAt`.
