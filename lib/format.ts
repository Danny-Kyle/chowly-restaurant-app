export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

export function formatMinutes(minutes: number) {
  return `${minutes} min${minutes === 1 ? '' : 's'}`
}
