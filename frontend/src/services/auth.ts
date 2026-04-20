import type {
  AuthResponse,
  CreateUserRequest,
  LoginRequest,
  User,
} from "@typecraft/shared";
import { api } from "./api";

export const authApi = {
  register: (data: CreateUserRequest) =>
    api.post<AuthResponse>("/auth/register", data),
  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),
  me: () => api.get<User>("/auth/me"),
};
