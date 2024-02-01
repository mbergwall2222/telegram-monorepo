export type IUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  pfpUrl: string;
};

export type IEnrichedUser = IUser & {
  chatCount: number;
  chatsList: { id: string; title: string }[];
  messageCount: number;
};

export type IGetUsersResponse = {
  users: IUser[];
};

export type IGetEnrichedUsersResponse = {
  data: IEnrichedUser[];
  totalRecords: number;
};
