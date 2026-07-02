import http from './http';
import type {
  CurrentUserPasswordUpdateRequest,
  CurrentUserProfileUpdateRequest,
  LoginRequest,
  RegisterRequest,
  ResponseData,
  UserKeyVO,
  UserVO,
} from '@/types/api';

export const userService = {
  login(data: LoginRequest) {
    return http.post<ResponseData<UserVO>>('/user/login', data).then((response) => response.data);
  },
  register(data: RegisterRequest) {
    return http.post<ResponseData<number>>('/user/register', data).then((response) => response.data);
  },
  logout() {
    return http.post<ResponseData<boolean>>('/user/logout').then((response) => response.data);
  },
  getLoginUser() {
    return http.get<ResponseData<UserVO>>('/user/get/login').then((response) => response.data);
  },
  getCurrentUserKeys() {
    return http.get<ResponseData<UserKeyVO>>('/user/get/keys').then((response) => response.data);
  },
  updateCurrentUserProfile(data: CurrentUserProfileUpdateRequest) {
    return http.post<ResponseData<boolean>>('/user/update/my/profile', data).then((response) => response.data);
  },
  updateCurrentUserPassword(data: CurrentUserPasswordUpdateRequest) {
    return http.post<ResponseData<boolean>>('/user/update/my/password', data).then((response) => response.data);
  },
};
