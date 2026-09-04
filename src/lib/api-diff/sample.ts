/**
 * Sample API schema pair for the breaking-change detector — previous vs
 * current, exercising the interesting classifications. Fabricated sample data.
 */

export interface ApiDiffSample {
  previous: string;
  current: string;
  label: string;
}

const previous = {
  title: "Order",
  type: "object",
  required: ["id", "customerId", "status"],
  properties: {
    id: { type: "string", format: "uuid" },
    customerId: { type: "integer" },
    status: { type: "string", enum: ["pending", "confirmed", "cancelled"] },
    currency: { type: "string", default: "USD" },
    items: { type: "array", items: { type: "object", properties: { sku: { type: "string" }, qty: { type: "integer" } } } },
    discount: { type: ["number", "null"] },
    shippingAddress: { type: "object", properties: { street: { type: "string" }, zip: { type: "string" } } },
  },
};

const current = {
  title: "Order",
  type: "object",
  required: ["id", "customerId", "status", "version"],
  properties: {
    id: { type: "string", format: "uuid" },
    customerId: { type: "string" },
    status: { type: "string", enum: ["pending", "confirmed", "cancelled", "refunded"] },
    version: { type: "integer", minimum: 1 },
    currency: { type: "string", default: "EUR" },
    items: { type: "array", items: { type: "object", properties: { sku: { type: "string" }, qty: { type: "integer" }, note: { type: "string" } } } },
    discount: { type: "number" },
  },
};

export function buildApiDiffSample(): ApiDiffSample {
  return {
    label: "Order API — schema v1 → v2",
    previous: JSON.stringify(previous, null, 2),
    current: JSON.stringify(current, null, 2),
  };
}