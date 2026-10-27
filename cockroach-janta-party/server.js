require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const Razorpay = require('razorpay');
const products = require('./data/products.json');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/config', (req, res) => res.json({ razorpayKeyId: keyId || null }));

// Price is always calculated on the server so customers cannot change it.
app.post('/api/create-order', async (req, res) => {
  try {
    if (!razorpay) return res.status(500).json({ error: 'Razorpay keys are not set. Add them to .env' });
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    let total = 0;
    for (const item of items) {
      const p = products.find(x => x.id === item.id);
      const qty = Number(item.qty);
      if (!p || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        return res.status(400).json({ error: 'Invalid cart item' });
      }
      total += p.price * qty;
    }
    if (total <= 0) return res.status(400).json({ error: 'Cart is empty' });

    const order = await razorpay.orders.create({
      amount: total * 100, // paise
      currency: 'INR',
      receipt: 'cjp_' + Date.now()
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order' });
  }
});

app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!keySecret) return res.status(500).json({ ok: false });
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');
  const ok = expected === razorpay_signature;
  res.status(ok ? 200 : 400).json({ ok });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Cockroach Janta Party running on port ' + PORT));
