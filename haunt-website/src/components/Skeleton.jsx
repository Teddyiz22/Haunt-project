// Loading skeletons that hold the shop layout while the catalog loads,
// so the page never flashes an empty grid or a bare "Loading" line.

export function ProductCardSkeleton() {
  return (
    <article className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__media skeleton-block" />
      <div className="product-card__meta">
        <div className="skeleton-line skeleton-line--short" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-line--short" />
      </div>
    </article>
  )
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="product-grid" aria-label="Loading the collection">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
