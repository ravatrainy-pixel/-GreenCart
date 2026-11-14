import { useContext } from "react";
import { useNotifications as useNotificationContext } from "./NotificationContext";

export default function useNotifications() {
  return useNotificationContext();
}