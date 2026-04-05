/** Libellés FR pour champs renvoyés par l’API membre / organisation. */

export const ORG_TYPE_LABELS_FR: Record<string, string> = {
  sales: "Vente (commerce)",
  delivery: "Livraison / logistique",
};

export function orgTypeLabel(orgType: string): string {
  return ORG_TYPE_LABELS_FR[orgType] ?? orgType;
}
