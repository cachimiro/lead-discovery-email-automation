"use client";

import { useEffect, useState } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  return (
    <div
      className={`
        ${colors[toast.type]}
        border rounded-lg p-4 shadow-lg min-w-[320px] max-w-md
        transition-all duration-300 ease-in-out
        ${isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[toast.type]}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{toast.title}</h4>
          <p className="text-sm mt-1">{toast.message}</p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onClose(toast.id), 300);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
