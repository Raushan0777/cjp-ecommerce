const $ = s => document.querySelector(s);
const rupee = n => '₹' + n.toLocaleString('en-IN');
let products = [];

async function loadProducts() {
  const res = await fetch('/api/products');
  products = await res.json();
  $('#products').innerHTML = products.map(p => `
    <article class="card">
      <div class="card-art" style="background:linear-gradient(135deg,${p.colors[0]} 0%,${p.colors[p.colors.length - 1]} 100%)">
        ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}
        <img src="img/mascot.svg" alt="">
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <span class="price">${rupee(p.price)}</span>
        <label class="sr">Size
          <select data-size="${p.id}">${p.sizes.map(s => `<option>${s}</option>`).join('')}</select>
        </label>
        <button class="btn" data-add="${p.id}">Add to cart</button>
      </div>
    </article>`).join('');
}

function renderCart() {
  const items = Cart.items();
  $('#cartCount').textContent = Cart.count();
  $('#cartTotal').textContent = rupee(Cart.total());
  $('#cartItems').innerHTML = items.length
    ? items.map(i => `
      <div class="cart-row">
        <div><strong>${i.name}</strong><br><small>Size ${i.size} · ${rupee(i.price)}</small></div>
        <strong>${rupee(i.price * i.qty)}</strong>
        <div class="qty">
          <button data-dec="${i.id}|${i.size}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button data-inc="${i.id}|${i.size}" aria-label="Increase">+</button>
        </div>
        <button class="remove" data-rm="${i.id}|${i.size}">Remove</button>
      </div>`).join('')
    : '<p class="empty">Your cart is empty. Add something from the collection.</p>';
}

function toggleCart(open) {
  $('#cartDrawer').classList.toggle('open', open);
  $('#cartDrawer').setAttribute('aria-hidden', String(!open));
  $('#scrim').classList.toggle('show', open);
}

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.add) {
    const p = products.find(x => x.id === t.dataset.add);
    const size = document.querySelector(`[data-size="${p.id}"]`).value;
    Cart.add(p, size);
    $('#cartMsg').textContent = '';
    toggleCart(true);
  }
  const split = v => v.split('|');
  const find = (id, size) => Cart.items().find(i => i.id === id && i.size === size);
  if (t.dataset.inc) { const [id, s] = split(t.dataset.inc); Cart.setQty(id, s, Math.min(find(id, s).qty + 1, 20)); }
  if (t.dataset.dec) { const [id, s] = split(t.dataset.dec); Cart.setQty(id, s, find(id, s).qty - 1); }
  if (t.dataset.rm) { const [id, s] = split(t.dataset.rm); Cart.remove(id, s); }
});

$('#openCart').onclick = () => toggleCart(true);
$('#closeCart').onclick = () => toggleCart(false);
$('#scrim').onclick = () => toggleCart(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleCart(false); });
document.addEventListener('cart:change', renderCart);

$('#checkoutBtn').onclick = async () => {
  const msg = $('#cartMsg');
  const items = Cart.items();
  if (!items.length) { msg.textContent = 'Add something to your cart first.'; return; }
  msg.textContent = 'Starting payment…';
  try {
    const cfg = await (await fetch('/api/config')).json();
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(i => ({ id: i.id, qty: i.qty })) })
    });
    const order = await res.json();
    if (!res.ok) throw new Error(order.error || 'Order failed');

    new Razorpay({
      key: cfg.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Cockroach Janta Party',
      description: 'Order payment',
      order_id: order.orderId,
      theme: { color: '#138808' },
      handler: async response => {
        const v = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        if (v.ok) { Cart.clear(); msg.textContent = 'Payment received. Thank you!'; }
        else msg.textContent = 'Payment could not be verified. Contact us with your payment ID: ' + response.razorpay_payment_id;
      },
      modal: { ondismiss: () => { msg.textContent = 'Payment cancelled. Your cart is saved.'; } }
    }).open();
  } catch (err) {
    msg.textContent = err.message;
  }
};

$('#year').textContent = new Date().getFullYear();
loadProducts().then(renderCart);
