import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

interface SocketMessage {
  type: string;
  content?: string;
  senderId?: string;
  roomId?: number;
  recipientId?: string;
  messageType?: string;
  userId?: string;
  isTyping?: boolean;
  targetUserId?: string;
}

export function useSocket(roomId?: number) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join with user ID
      ws.send(JSON.stringify({
        type: "join",
        userId: user.id,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "message":
            // Handle incoming message - you might want to add this to a global state
            break;
            
          case "typing":
            if (data.roomId === roomId) {
              setTypingUsers(prev => {
                if (data.isTyping) {
                  return prev.includes(data.userId) ? prev : [...prev, data.userId];
                } else {
                  return prev.filter(id => id !== data.userId);
                }
              });
            }
            break;
            
          case "call":
            // Handle call signaling
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user, roomId]);

  const sendMessage = (message: Omit<SocketMessage, "type">) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        ...message,
      }));
    }
  };

  const sendTypingIndicator = (isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        userId: user?.id,
        roomId,
        isTyping,
      }));
    }
  };

  const sendCallSignal = (targetUserId: string, signalData: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call",
        targetUserId,
        ...signalData,
      }));
    }
  };

  return {
    isConnected,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    sendCallSignal,
  };
}
