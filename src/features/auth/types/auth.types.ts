export interface TechnicianUser {
  id: string;
  documentNumber: string;
  fullName: string;
  zone: string;
  mustChangePassword: boolean;
}

export interface LoginCredentials {
  documentNumber: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}