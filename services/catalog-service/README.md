# catalog-service

Manages products: create, read, update, delete. Owner: Mohamed. Port: **4002**.

## Run locally

```bash
cd services/catalog-service
cp .env.example .env   # then fill in MONGO_URI
npm install
npm run dev            # nodemon, restarts on change
# or: npm start
```

Server starts on `http://localhost:4002`.

## Environment variables

| Variable    | Description                          |
|-------------|---------------------------------------|
| `PORT`      | Port to listen on (default 4002)      |
| `MONGO_URI` | MongoDB Atlas connection string       |

## Endpoints

| Method | Path             | Body                                 | Response                          |
|--------|------------------|----------------------------------------|-------------------------------------|
| POST   | `/products`      | `{ name, description, price }`       | `201` → created product             |
| GET    | `/products`      | –                                     | `200` → array of all products       |
| GET    | `/products/:id`  | –                                     | `200` → one product                 |
| PUT    | `/products/:id`  | any of `{ name, description, price }` | `200` → updated product             |
| DELETE | `/products/:id`  | –                                     | `200` → `{ message, id }`           |
| GET    | `/health`        | –                                     | `200` → `{ status: "ok" }`          |

## Error shape

All errors follow:
```json
{ "error": true, "message": "...", "statusCode": 404 }
```

## Notes

- `price` must be a positive number — validated on create and update.
- Requesting a malformed `:id` returns `404` instead of crashing (CastError handled).
- This service is one of the "leaf" services `order-service` calls to fetch product price/name (Section 4.6 step 2).
