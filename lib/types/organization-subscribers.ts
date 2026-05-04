/** Réponse `GET /api/v1/members/organizations/{organization_id}/subscribers` (guide_api). */
export type OrganizationSubscriber = {
  customer_id: string;
  username: string;
  subscribed_at: string;
};

export type OrganizationSubscribersListResponse = {
  items: OrganizationSubscriber[];
  total: number;
  limit: number;
  offset: number;
};
