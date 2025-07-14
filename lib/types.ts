export interface UserAccessInfo {
  imageUrl: string | null;
  name: string | null;
  email: string;
  access: "owner" | "can edit" | "can view";
}
