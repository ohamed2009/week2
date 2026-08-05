# user-service

Handles user registration, login, and profile lookup. Owner: Mohamed. Port: **4001**.

## Run locally

```bash
cd services/user-service
cp .env.example .env   # then fill in MONGO_URI
npm install
npm run dev            # nodemon, restarts on change
# or: npm start
```

Server starts on `http://localhost:4001`.

## Environment variables

| Variable    | Description                          |
|-------------|---------------------------------------|
| `PORT`      | Port to listen on (default 4001)      |
| `MONGO_URI` | MongoDB Atlas connection string       |

## Endpoints

| Method | Path            | Body                              | Response                              |
|--------|-----------------|------------------------------------|----------------------------------------|
| POST   | `/users/register` | `{ name, email, password }`      | `201` → `{ userId, name, email, createdAt }` |
| POST   | `/users/login`    | `{ email, password }`            | `200` → `{ token, userId }`           |
| GET    | `/users/:id`      | –                                 | `200` → user profile (no password)    |
| GET    | `/health`         | –                                 | `200` → `{ status: "ok" }`            |

## Error shape

All errors follow:
```json
{ "error": true, "message": "...", "statusCode": 404 }
```

## Notes

- Passwords are hashed with `bcrypt` before storage — never stored in plaintext.
- The login token is a random hex string, **not** a real JWT. Upgrading to JWT is a weekend stretch goal.
- `GET /users/:id` with a malformed id returns `404` instead of crashing.
