export enum UserRole {
  CLIENT = 'client',
  WASHER = 'washer',
  FRANCHISE_OWNER = 'franchise_owner',
  ADMIN = 'admin',
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
  profilePictureImageId?: number;
  createdAt: Date;
}
