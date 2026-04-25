# Quickshop API sample testing (cURL)

Assumes:
- API runs at `http://localhost:3000`
- Postgres is running and the schema is already created (see `backend-readme.md`)

## Start the API

```bash
pnpm install
pnpm start:dev
```

## 0) (Optional) set a base URL

```bash
export BASE_URL="http://localhost:3000"
```

## 1) Create users

### Create a Store Owner

```bash
curl -sS -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shop Owner",
    "phone": "08011112222",
    "password": "123456",
    "role": "STORE_OWNER"
  }'
```

Copy the returned `id` into an env var:

```bash
export OWNER_ID="REPLACE_WITH_OWNER_ID"
```

### Create a Customer

```bash
curl -sS -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer",
    "phone": "08099998888",
    "password": "123456",
    "role": "CUSTOMER"
  }'
```

Copy the returned `id`:

```bash
export CUSTOMER_ID="REPLACE_WITH_CUSTOMER_ID"
```

## 2) Create a store (must be STORE_OWNER)

```bash
curl -sS -X POST "$BASE_URL/stores" \
  -H "Content-Type: application/json" \
  -d "{
    \"ownerId\": \"$OWNER_ID\",
    \"name\": \"Test Store\",
    \"phone\": \"08012345678\",
    \"address\": \"Lekki\",
    \"latitude\": 6.45,
    \"longitude\": 3.4
  }"
```

Copy the returned `id`:

```bash
export STORE_ID="REPLACE_WITH_STORE_ID"
```

### Nearby stores

```bash
curl -sS "$BASE_URL/stores/nearby?lat=6.45&lng=3.4"
```

## 3) Create a product (linked to a store)

```bash
curl -sS -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Rice\",
    \"description\": \"50kg bag\",
    \"price\": 45000,
    \"stock\": 10,
    \"image_url\": \"\",
    \"store_id\": \"$STORE_ID\"
  }"
```

Copy the returned product `id`:

```bash
export PRODUCT_ID="REPLACE_WITH_PRODUCT_ID"
```

### Get products by store

```bash
curl -sS "$BASE_URL/products/store/$STORE_ID"
```

## 4) Place an order (customer)

```bash
curl -sS -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$CUSTOMER_ID\",
    \"store_id\": \"$STORE_ID\",
    \"items\": [
      { \"product_id\": \"$PRODUCT_ID\", \"quantity\": 2 }
    ]
  }"
```

Copy the returned order `id` and `pickupCode`:

```bash
export ORDER_ID="REPLACE_WITH_ORDER_ID"
export PICKUP_CODE="REPLACE_WITH_PICKUP_CODE"
```

### Get order by id

```bash
curl -sS "$BASE_URL/orders/$ORDER_ID"
```

## 5) Store workflow (accept → ready → complete)

> No auth is enforced yet, so these endpoints are open. They update the order status.

### Accept

```bash
curl -sS -X PATCH "$BASE_URL/orders/$ORDER_ID/accept"
```

### Mark ready

```bash
curl -sS -X PATCH "$BASE_URL/orders/$ORDER_ID/ready"
```

### Complete (requires pickup code; reduces stock)

```bash
curl -sS -X PATCH "$BASE_URL/orders/$ORDER_ID/complete" \
  -H "Content-Type: application/json" \
  -d "{
    \"pickup_code\": \"$PICKUP_CODE\"
  }"
```

## Common failure tests

### Try creating a store with a CUSTOMER as owner (should be 403)

```bash
curl -sS -X POST "$BASE_URL/stores" \
  -H "Content-Type: application/json" \
  -d "{
    \"ownerId\": \"$CUSTOMER_ID\",
    \"name\": \"Bad Store\",
    \"phone\": \"08022223333\",
    \"address\": \"Ikeja\",
    \"latitude\": 6.6,
    \"longitude\": 3.35
  }"
```

### Try completing with the wrong pickup code (should be 400)

```bash
curl -sS -X PATCH "$BASE_URL/orders/$ORDER_ID/complete" \
  -H "Content-Type: application/json" \
  -d '{ "pickup_code": "000000" }'
```

