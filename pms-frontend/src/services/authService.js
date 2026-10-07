const AUTH_STORAGE_KEYS = [
  "userId",
  "userName",
  "userEmail",
  "userRole",
  "name",
  "email",
  "role",
  "token",
  "accessToken",
  "jwt",
];

export const clearAuthSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};
