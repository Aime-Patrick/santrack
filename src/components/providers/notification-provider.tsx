"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("santrack_token") : null;
    if (!token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081"}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    socket.on("unread_count", (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  const markRead = useCallback((id: number) => {
    socketRef.current?.emit("mark_read", { notificationId: id });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    socketRef.current?.emit("mark_all_read");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, unreadCount, notifications, markRead, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}
