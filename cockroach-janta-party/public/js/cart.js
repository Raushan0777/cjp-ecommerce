// Cart stored in localStorage. Prices here are for display only;
// the server recalculates the real total when creating the order.
const Cart = (() => {
  const KEY = 'cjp_cart_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = items => { localStorage.setItem(KEY, JSON.stringify(items)); document.dispatchEvent(new Event('cart:change')); };

  return {
    items: read,
    add(product, size) {
      const items = read();
      const found = items.find(i => i.id === product.id && i.size === size);
      if (found) found.qty = Math.min(found.qty + 1, 20);
      else items.push({ id: product.id, name: product.name, price: product.price, size, qty: 1 });
      write(items);
    },
    setQty(id, size, qty) {
      let items = read();
      items = items.map(i => (i.id === id && i.size === size ? { ...i, qty } : i)).filter(i => i.qty > 0);
      write(items);
    },
    remove(id, size) { write(read().filter(i => !(i.id === id && i.size === size))); },
    clear() { write([]); },
    count: () => read().reduce((n, i) => n + i.qty, 0),
    total: () => read().reduce((n, i) => n + i.price * i.qty, 0)
  };
})();
