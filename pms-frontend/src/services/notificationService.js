import axios from "axios";

const API_URL = "http://localhost:8082/api/notifications";

export async function getNotifications(userId) {
  const response = await axios.get(`${API_URL}/user/${userId}`);
  return response.data?.data || [];
}

export async function getUnreadNotificationCount(userId) {
  const response = await axios.get(`${API_URL}/user/${userId}/unread-count`);
  return Number(response.data?.data || 0);
}

export async function markNotificationRead(userId, notificationId) {
  const response = await axios.patch(`${API_URL}/user/${userId}/${notificationId}/read`);
  return response.data?.data;
}
