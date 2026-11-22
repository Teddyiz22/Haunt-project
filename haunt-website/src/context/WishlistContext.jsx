import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'haunt-wishlist-v1'

function loadInitial() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry) => entry && entry.slug)
  } catch {
    return []
  }
}

function snapshotOf(product) {
  return {
    slug: product.slug,
    name: product.name,
    price_mmk: product.price_mmk,
    imageUrl: product.images?.[0]?.url || '',
    in_stock: Boolean(product.in_stock),
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(loadInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Private browsing or a full store must not break the wishlist.
    }
  }, [items])

  const toggleWishlist = useCallback((product) => {
    if (!product?.slug) return false
    let added = false
    setItems((current) => {
      if (current.some((entry) => entry.slug === product.slug)) {
        return current.filter((entry) => entry.slug !== product.slug)
      }
      added = true
      return [...current, snapshotOf(product)]
    })
    return added
  }, [])

  const isWishlisted = useCallback(
    (slug) => items.some((entry) => entry.slug === slug),
    [items],
  )

  const value = useMemo(
    () => ({ items, count: items.length, toggleWishlist, isWishlisted }),
    [items, toggleWishlist, isWishlisted],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const wishlist = useContext(WishlistContext)
  if (!wishlist) throw new Error('useWishlist must be used inside a WishlistProvider.')
  return wishlist
}
