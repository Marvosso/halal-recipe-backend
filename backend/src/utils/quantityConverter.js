// Applies conversion ratio to the quantity
export function applyConversionRatio(quantity, ratio) {
  if (!quantity || !ratio) return quantity;
  return Number((quantity * ratio).toFixed(2));
}
