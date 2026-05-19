export type UserRole = "musician" | "label";

export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type LoginBody = {
  email: string;
  password: string;
};
