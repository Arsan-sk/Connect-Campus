import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageBubble from "@/components/MessageBubble";
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  FolderOpen, 
  Settings, 
  Paperclip, 
  Mic, 
  Send 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  roomId: number;
  onFileUpload: () => void;
  onStartCall: () => void;
  onToggleFileExplorer: () => void;
  onBack?: () => void;
}

export default function ChatArea({
  roomId,
  onFileUpload,
  onStartCall,
  onToggleFileExplorer,
  onBack
}: ChatAreaProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, typingUsers } = useSocket(roomId);

  const { data: room } = useQuery({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/rooms", roomId, "messages"],
    enabled: !!roomId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/rooms", roomId, "members"],
    enabled: !!roomId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;

    sendMessage({
      content: message.trim(),
      senderId: user.id,
      roomId,
      messageType: "text",
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      // Send typing indicator
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      // Send stop typing indicator
    }
  };

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a room to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Avatar className="w-10 h-10">
              <AvatarImage src={room.imageUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {room.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-lg">{room.name}</h1>
              <p className="text-sm text-gray-500">
                {members.length} members • 12 files
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={onStartCall}>
              <Phone className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onStartCall}>
              <Video className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggleFileExplorer}>
              <FolderOpen className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* System Message */}
        <div className="text-center">
          <div className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full inline-block">
            <span className="mr-1">ℹ️</span>
            {room.name} was created
          </div>
        </div>

        {/* Messages */}
        {messages.map((msg: any) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwnMessage={msg.senderId === user?.id}
          />
        ))}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-100">
                {typingUsers[0][0]}
              </AvatarFallback>
            </Avatar>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">
                  {typingUsers[0]} is typing
                </span>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <Button variant="ghost" size="icon" onClick={onFileUpload}>
            <Paperclip className="w-5 h-5 text-gray-600" />
          </Button>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <Textarea
                placeholder="Type a message..."
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-3 bg-transparent resize-none border-0 focus-visible:ring-0 text-sm min-h-[44px] max-h-32"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Mic className="w-5 h-5 text-gray-600" />
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
