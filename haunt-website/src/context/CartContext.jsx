import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'haunt-cart-v1'

function normalizeItem(item) {
  if (!item || !item.variantId) return null
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const stock = Number(item.stockQuantity)
  return {
    productId: item.productId ?? null,
    slug: item.slug || '',
    name: item.name || '',
    imageUrl: item.imageUrl || '',
    variantId: item.variantId,
    size: item.size || '',
    unitPriceMmk: Number(item.unitPriceMmk) || 0,
    stockQuantity: Number.isFinite(stock) ? stock : null,
    quantity: Number.isFinite(stock) ? Math.min(quantity, Math.max(1, stock)) : quantity,
  }
}

function loadInitialItems() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeItem).filter(Boolean)
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialItems)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Private browsing or a full store must not break the bag.
    }
  }, [items])

  const addItem = useCallback((rawItem) => {
    const item = normalizeItem(rawItem)
    if (!item) return
    setItems((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId)
      if (!existing) return [...current, item]
      const stock = existing.stockQuantity
      const quantity = Number.isFinite(stock)
        ? Math.min(existing.quantity + item.quantity, Math.max(1, stock))
        : existing.quantity + item.quantity
      return current.map((entry) =>
        entry.variantId === item.variantId ? { ...entry, quantity } : entry,
      )
    })
  }, [])

  // ProductDetails dispatches this event via cartIntegration.addToBag().
  useEffect(() => {
    const handleAddToBag = (event) => addItem(event.detail)
    window.addEventListener('haunt:add-to-bag', handleAddToBag)
    return () => window.removeEventListener('haunt:add-to-bag', handleAddToBag)
  }, [addItem])

  const updateQuantity = useCallback((variantId, nextQuantity) => {
    setItems((current) =>
      current
        .map((entry) => {
          if (entry.variantId !== variantId) return entry
          const amount = Math.max(0, Number(nextQuantity) || 0)
          const capped = Number.isFinite(entry.stockQuantity)
            ? Math.min(amount, Math.max(1, entry.stockQuantity))
            : amount
          return { ...entry, quantity: capped }
        })
        .filter((entry) => entry.quantity > 0),
    )
  }, [])

  const removeItem = useCallback((variantId) => {
    setItems((current) => current.filter((entry) => entry.variantId !== variantId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const subtotal = items.reduce(
      (total, entry) => total + entry.unitPriceMmk * entry.quantity,
      0,
    )
    const itemCount = items.reduce((total, entry) => total + entry.quantity, 0)
    return {
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      itemCount,
    }
  }, [items, addItem, updateQuantity, removeItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart must be used inside a CartProvider.')
  return cart
}
