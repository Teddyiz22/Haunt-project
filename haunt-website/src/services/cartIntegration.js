// Integration point for Step 12 shopping cart.
// This does not create a cart, checkout, or order.

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
    variantId: variant.id,
    size: variant.size,
    quantity: amount,
    unitPriceMmk: product.price_mmk,
  }

  window.dispatchEvent(new CustomEvent('haunt:add-to-bag', { detail: item }))
  return { ok: true, item }
}
