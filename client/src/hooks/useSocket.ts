import { useState, useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { queryClient } from "@/lib/queryClient";

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
      // Authenticate with user ID
      ws.send(JSON.stringify({
        type: "authenticate",
        userId: user.id,
      }));
      
      // Join room if specified
      if (roomId) {
        ws.send(JSON.stringify({
          type: "join_room",
          roomId,
        }));
      }

      ws.send(JSON.stringify({
        type: "subscribe_status_updates"
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "authenticated":
            console.log("WebSocket authenticated for user:", data.userId);
            break;
            
          case "joined_room":
            console.log("Joined room:", data.roomId);
            break;
            
          case "new_message":
            // Invalidate chat queries to refresh messages
            queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
            if (data.data?.roomId) {
              queryClient.invalidateQueries({ queryKey: ["/api/rooms", data.data.roomId, "messages"] });
            }
            if (data.data?.recipientId || data.data?.senderId) {
              queryClient.invalidateQueries({ queryKey: ["/api/chats", data.data.recipientId || data.data.senderId, "messages"] });
            }
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
            
          case "update_message_status":
            // Update message status locally
            queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
            // Invalidate all message queries to ensure status updates are reflected
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
            break;
            
          case "message_read":
            // Handle individual message read updates
            queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
            break;
            
          case "chat_messages_read":
            // Handle bulk message read updates
            queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
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
      if (roomId) {
        ws.send(JSON.stringify({
          type: "leave_room",
          roomId,
        }));
      }
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
