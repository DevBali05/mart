// Fixed shipping charge applied to every order.
export const SHIPPING_CHARGE = 20; // AED

/**
 * Extracts a numeric amount from a free-text price string like "AED 2500" or "Rs. 2500".
 */
export function parseAmount(value) {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

export function formatAED(amount) {
  return `AED ${amount.toFixed(2)}`;
}

/**
 * Product price + shipping charge, as a number.
 */
export function computeOrderTotal(order) {
  const shipping =
    order.shippingCharges !== undefined && order.shippingCharges !== null
      ? parseAmount(order.shippingCharges)
      : SHIPPING_CHARGE;
  return parseAmount(order.price) + shipping;
}