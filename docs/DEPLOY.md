# Deployment guide (Render + MongoDB Atlas)

This deploys the six services as free Render web services, backed by a free
MongoDB Atlas cluster. Nothing in the application code changes — only `.env`
values (here, Render environment variables) differ from local.

## 1. MongoDB Atlas (the database)

1. Go to <https://cloud.mongodb.com> and sign in (or create a free account).
2. Create a **free M0 cluster** (any provider/region).
3. **Database Access** -> add a database user (username + password). Save them.
4. **Network Access** -> Add IP Address -> **Allow access from anywhere**
   (`0.0.0.0/0`). Render's IPs are dynamic, so this is required for the free tier.
5. **Connect** -> **Drivers** -> copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. One cluster is enough — give each service its **own database** by adding the
   db name in the path. You will paste one of these per service in step 3:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/user-db?retryWrites=true&w=majority
   mongodb+srv://.../catalog-db?retryWrites=true&w=majority
   mongodb+srv://.../inventory-db?retryWrites=true&w=majority
   mongodb+srv://.../notification-db?retryWrites=true&w=majority
   mongodb+srv://.../payment-db?retryWrites=true&w=majority
   mongodb+srv://.../order-db?retryWrites=true&w=majority
   ```

## 2. Deploy all six services (Render Blueprint)

1. Go to <https://dashboard.render.com> and sign in with GitHub.
2. **New +** -> **Blueprint**.
3. Select the `team-project` repository. Render reads `render.yaml` and lists the
   six services.
4. Click **Apply**. Render creates and starts building all six.

## 3. Set each service's `MONGO_URI`

For every service, open it in Render -> **Environment** -> set `MONGO_URI` to that
service's connection string from step 1.6 -> **Save** (it redeploys).

## 4. Wire order-service to the other services

Once the five other services are live, each has a public URL like
`https://user-service-xxxx.onrender.com`. Copy them, then open **order-service**
-> **Environment** and set:

| Variable                    | Value                                        |
| --------------------------- | -------------------------------------------- |
| `USER_SERVICE_URL`          | the deployed user-service URL                |
| `CATALOG_SERVICE_URL`       | the deployed catalog-service URL             |
| `INVENTORY_SERVICE_URL`     | the deployed inventory-service URL           |
| `PAYMENT_SERVICE_URL`       | the deployed payment-service URL             |
| `NOTIFICATION_SERVICE_URL`  | the deployed notification-service URL        |

Use the full `https://...onrender.com` URL, **no trailing slash, no port**. Save
(order-service redeploys).

## 5. Verify

Hit each health endpoint in the browser:
`https://<service>.onrender.com/health` -> should return `{ "status": "ok" }`.

Then run the full flow against the deployed order-service (register a user and
create a product first, via their deployed endpoints), exactly like the local
Postman collection but with the deployed URLs.

## Free-tier note (important for the demo)

Free Render services **sleep after ~15 min of inactivity** and take ~30–50s to
wake up. Since `order-service` calls the others with a 5s timeout, a cold
downstream can make an order fail with `503`. **Before a live demo, wake every
service first** by opening each `/health` URL, then place the order.
