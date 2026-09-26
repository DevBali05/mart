export const ORDER_STAGES = [
  { key: "ordered", label: "Ordered", dateField: "orderedAt" },
  { key: "confirmed", label: "Confirmed", dateField: "confirmedAt" },
  { key: "shipped", label: "Shipped", dateField: "shippedAt" },
  { key: "out_for_delivery", label: "Out for Delivery", dateField: "outForDeliveryAt" },
  { key: "delivered", label: "Delivered", dateField: "deliveredAt" },
];

export const EXTRA_STATUSES = [
  { key: "no_answer", label: "No Answer", dateField: "noAnswerAt" },
  { key: "cancelled", label: "Cancelled", dateField: "cancelledAt" },
];

export const ALL_STATUSES = [...ORDER_STAGES, ...EXTRA_STATUSES];

export function isExtraStatus(status) {
  return EXTRA_STATUSES.some((s) => s.key === status);
}

export function stageIndex(status) {
  return ORDER_STAGES.findIndex((s) => s.key === status);
}

export function nextStage(status) {
  const idx = stageIndex(status);
  if (idx === -1 || idx === ORDER_STAGES.length - 1) return null;
  return ORDER_STAGES[idx + 1];
}

export function statusLabel(status) {
  return ALL_STATUSES.find((s) => s.key === status)?.label || status;
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}