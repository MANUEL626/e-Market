import type { WholesalePriceTier } from "@/lib/types/article-orders";

export type WholesaleFormRow = {
  id: string;
  minQty: string;
  maxQty: string;
  unitPrice: string;
};

export function newWholesaleRow(): WholesaleFormRow {
  return { id: crypto.randomUUID(), minQty: "", maxQty: "", unitPrice: "" };
}

export function wholesaleTiersToRows(
  tiers: WholesalePriceTier[] | null | undefined
): WholesaleFormRow[] {
  if (!tiers?.length) return [newWholesaleRow()];
  return tiers.map((t) => ({
    id: crypto.randomUUID(),
    minQty: String(t.min_quantity),
    maxQty: t.max_quantity == null ? "" : String(t.max_quantity),
    unitPrice: String(t.unit_price),
  }));
}

function parseNonNegativeNumber(raw: string, fallback: number) {
  const n = Number.parseFloat(String(raw).replace(",", "."));
  if (Number.isNaN(n) || n < 0) return fallback;
  return n;
}

function parseIntNonNegative(raw: string, fallback: number) {
  const n = Number.parseInt(String(raw).replace(/\s/g, ""), 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return n;
}

export function parseWholesaleRowsToTiers(
  rows: WholesaleFormRow[]
): WholesalePriceTier[] | undefined {
  const tiers: WholesalePriceTier[] = [];
  for (const row of rows) {
    const minS = row.minQty.trim();
    const maxS = row.maxQty.trim();
    const priceS = row.unitPrice.trim();
    if (!minS && !maxS && !priceS) continue;
    if (!minS || !priceS) {
      throw new Error(
        "Prix de vente en lot : chaque palier renseigné doit avoir une quantité min. et un prix unitaire."
      );
    }
    const min_quantity = parseIntNonNegative(minS, -1);
    if (min_quantity < 1) {
      throw new Error("Quantité min. d’un palier doit être un entier ≥ 1.");
    }
    const unit_price = parseNonNegativeNumber(priceS, NaN);
    if (Number.isNaN(unit_price)) {
      throw new Error("Prix unitaire du palier invalide.");
    }
    let max_quantity: number | null = null;
    if (maxS !== "") {
      const maxVal = parseIntNonNegative(maxS, -1);
      if (maxVal < 1) {
        throw new Error("Quantité max. d’un palier doit être un entier ≥ 1 si renseignée.");
      }
      if (maxVal < min_quantity) {
        throw new Error("La quantité max. doit être supérieure ou égale à la quantité min.");
      }
      max_quantity = maxVal;
    }
    tiers.push({ min_quantity, max_quantity, unit_price });
  }
  return tiers.length > 0 ? tiers : undefined;
}
