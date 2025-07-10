export type UserInfo = {
  name: string;
  imageUrl: string;
  color: string;
};

export type UserAwareness = {
  user?: UserInfo;
};

export type AwarenessList = [number, UserAwareness][];
