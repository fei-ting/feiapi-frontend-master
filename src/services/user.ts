import http from './http';
import type {
  CurrentUserPasswordUpdateRequest,
  CurrentUserProfileUpdateRequest,
  LoginRequest,
  RegisterRequest,
  UserKeyVO,
  UserVO,
} from '@/types/user';

export const userService = {
  login(data: LoginRequest) {
    return http.post<UserVO>('/user/login', data);
  },
  register(data: RegisterRequest) {
    return http.post<number>('/user/register', data);
  },
  logout() {
    return http.post<boolean>('/user/logout');
  },
  getLoginUser() {
    return http.get<UserVO>('/user/get/login');
  },
  getCurrentUserKeys() {
    return http.get<UserKeyVO>('/user/get/keys');
  },
  updateCurrentUserProfile(data: CurrentUserProfileUpdateRequest) {
    return http.post<boolean>('/user/update/my/profile', data);
  },
  updateCurrentUserPassword(data: CurrentUserPasswordUpdateRequest) {
    return http.post<boolean>('/user/update/my/password', data);
  },
};
