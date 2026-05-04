export type CustomerSaleStatus =
  | "pending"
  | "in_progress"
  | "in_delivery"
  | "cancelled"
  | "completed";

export type CustomerSaleMode = "pickup" | "delivery" | "walk_in_offline";

export type CustomerSaleOrderLine = {
  id: string;
  article_id: string;
  article_name?: string | null;
  quantity: number;
  unit_price_snapshot?: string | number | null;
  unit_price?: number | null;
  line_total?: number | null;
  created_at?: string;
};

export type CustomerSaleOrder = {
  id: string;
  organization_id: string;
  customer_id: string | null;
  status: CustomerSaleStatus;
  fulfillment_type?: CustomerSaleMode | string;
  mode?: CustomerSaleMode | string;
  assigned_delivery_member_id?: string | null;
  delivery_longitude?: number | null;
  delivery_latitude?: number | null;
  currency?: string | null;
  total_amount?: number | null;
  subtotal_amount?: string | number | null;
  total_items?: number | null;
  total_lines?: number | null;
  external_customer_label: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type CustomerSaleOrderDetail = {
  order: CustomerSaleOrder;
  lines: CustomerSaleOrderLine[];
};

export type CustomerSaleHistoryEvent = {
  id: string;
  order_id: string;
  from_status: CustomerSaleStatus | null;
  to_status: CustomerSaleStatus;
  note: string | null;
  created_at: string;
};

export type CustomerSaleStatusGroup = Exclude<CustomerSaleStatus, "pending">;

export type UpdateCustomerSaleStatusPayload = {
  status: CustomerSaleStatus;
  note?: string;
};

export type CreateWalkInSalePayload = {
  lines: { article_id: string; quantity: number }[];
  external_customer_label?: string;
  notes?: string;
};

export type CustomerSaleReceiptTokenResponse = {
  secret: string;
  qr_payload: string;
};

export type AssignDeliveryPayload = {
  member_id: string;
};
