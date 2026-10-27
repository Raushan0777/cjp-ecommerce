# Cockroach Janta Party

Clothing brand store with a tricolor-inspired look, a cockroach mascot, a localStorage cart and Razorpay payments (UPI and cards).

## Tech
- Node.js + Express backend
- Plain HTML/CSS/JS frontend (`public/`)
- Razorpay Orders API with server-side price calculation and signature verification

## Run locally
```bash
npm install
cp .env.example .env     # then add your Razorpay test keys
npm start
```
Open http://localhost:3000

## Project structure
```
server.js            Express server and Razorpay endpoints
data/products.json   Product catalogue (edit prices and items here)
public/              Website (index.html, css, js, img)
```

## API
| Route | Purpose |
|---|---|
| GET `/api/products` | Product list |
| GET `/api/config` | Public Razorpay key id |
| POST `/api/create-order` | Creates an order from `[{id, qty}]` |
| POST `/api/verify-payment` | Verifies Razorpay signature |

## Deploy
Works on Replit, Render or Railway. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as environment variables (never commit `.env`).

## License
MIT
