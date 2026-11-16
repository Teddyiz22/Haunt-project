// Integration point for the shopping bag: validates size/stock, then hands
// the item to CartContext via the 'haunt:add-to-bag' window event.

export function addToBag({ product, variant, quantity }) {
  if (!variant?.available) {
    return { ok: false, reason: 'That size is unavailable.' }
  }

  const stock = Number(variant.stock_quantity)
  const amount = Number(quantity)
  if (!Number.isInteger(amount) || amount < 1) {
    return { ok: false, reason: 'Choose a quantity of at least 1.' }
  }
  if (amount > stock) {
    return { ok: false, reason: 'Requested quantity exceeds available stock.' }
  }

  const item = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: product.images?.[0]?.url || '',
    variantId: variant.id,
    size: variant.size,
    quantity: amount,
    unitPriceMmk: product.price_mmk,
    stockQuantity: stock,
  }

  window.dispatchEvent(new CustomEvent('haunt:add-to-bag', { detail: item }))
  return { ok: true, item }
}
