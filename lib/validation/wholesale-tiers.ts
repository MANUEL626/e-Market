import type { WholesalePriceTier } from "@/lib/types/article-orders";

/**
 * Vérifie que les paliers de prix de gros forment une partition continue des quantités à partir de 1 :
 * premier palier à min = 1, pas de chevauchement ni de trou, seul le dernier peut être « sans plafond ».
 * Retourne les paliers triés par quantité min. (ordre attendu côté API).
 */
export function validateContiguousWholesaleTiers(
  tiers: WholesalePriceTier[]
): WholesalePriceTier[] {
  if (tiers.length === 0) return [];

  const sorted = [...tiers].sort((a, b) => {
    if (a.min_quantity !== b.min_quantity) return a.min_quantity - b.min_quantity;
    const am = a.max_quantity ?? Number.POSITIVE_INFINITY;
    const bm = b.max_quantity ?? Number.POSITIVE_INFINITY;
    if (am !== bm) return am - bm;
    return a.unit_price - b.unit_price;
  });

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min_quantity === sorted[i - 1].min_quantity) {
      throw new Error(
        "Deux paliers ne peuvent pas commencer à la même quantité minimale."
      );
    }
  }

  if (sorted[0].min_quantity !== 1) {
    throw new Error(
      "Le premier palier doit commencer à la quantité 1 (puis enchaîner sans trou ni chevauchement)."
    );
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (cur.max_quantity === null) {
      throw new Error(
        "Un palier sans plafond ne peut pas être suivi d’un autre : seul le dernier palier peut être sans quantité max."
      );
    }
    const expectedNextMin = cur.max_quantity + 1;
    if (next.min_quantity !== expectedNextMin) {
      throw new Error(
        `Les paliers doivent se suivre exactement : après « ${cur.min_quantity}–${cur.max_quantity} », le palier suivant doit commencer à ${expectedNextMin} (actuellement ${next.min_quantity}). Corrigez le chevauchement ou le trou.`
      );
    }
  }

  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1];
    if (last.max_quantity !== null) {
      throw new Error(
        "Avec plusieurs paliers, le dernier doit être sans plafond (quantité max. vide), pour couvrir toutes les quantités au-delà du palier précédent."
      );
    }
  }

  return sorted;
}
