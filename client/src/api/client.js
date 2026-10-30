import axios from "axios";


export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});


api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isAuthCall = url.startsWith("/auth/");


    if (status === 403) {
      window.location.assign("/not-allowed");
    } else if (status === 401 && !isAuthCall) {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);
