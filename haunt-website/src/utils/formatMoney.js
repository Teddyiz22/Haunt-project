export function formatMmk(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `${new Intl.NumberFormat('en-US').format(amount)} MMK`
}
