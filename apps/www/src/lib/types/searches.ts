export type SavedSearch = {
  id: string;
  name: string;
  params: string;
  user: { firstName?: string; lastName?: string; imageUrl?: string };
};
