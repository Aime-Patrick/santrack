"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  module: string | null;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  unreadCount: number;
  notifications: Notification[];
  markRead: (id: number) => void;
  markAllRead: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  unreadCount: 0,
  notifications: [],
  markRead: () => {},
  markAllRead: () => {},
});

export function useNotifications() {
  return useContext(SocketContext);
}

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadRest = useCallback(() => {
    api
      .get<Notification[]>("/api/notifications", { params: { limit: 20 } })
      .then((res) => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.read).length);
      })
      .catch(() => {});

    api
      .get<{ count: number }>("/api/notifications/count")
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {});
  }, []);

  const connectSocket = useCallback(
    (token: string) => {
      socketRef.current?.disconnect();

      const socket = io(`${apiBase()}/notifications`, {
        auth: { token },
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      socket.on("notification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
        setUnreadCount((prev) => prev + 1);
      });

      socket.on("unread_count", (data: { count: number }) => {
        setUnreadCount(data.count);
      });
    },
    [],
  );

  useEffect(() => {
    const boot = () => {
      const token = getAuthToken();
      if (!token) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setConnected(false);
        return;
      }
      loadRest();
      connectSocket(token);
    };

    boot();

    // Login/logout in this tab updates localStorage without a storage event.
    const onAuthChanged = () => boot();
    window.addEventListener("santrack-auth-changed", onAuthChanged);
    window.addEventListener("storage", (event) => {
      if (event.key === "auth_token") onAuthChanged();
    });

    return () => {
      window.removeEventListener("santrack-auth-changed", onAuthChanged);
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [connectSocket, loadRest]);

  const markRead = useCallback((id: number) => {
    socketRef.current?.emit("mark_read", { notificationId: id });
    api.patch(`/api/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(() => {
    socketRef.current?.emit("mark_all_read");
    api.patch("/api/notifications/read-all").catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        unreadCount,
        notifications,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
