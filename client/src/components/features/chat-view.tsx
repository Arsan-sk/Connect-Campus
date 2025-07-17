import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, Phone, Video, MoreVertical, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Chat {
  id: number;
  participants: Array<{
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    status: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  chatId: number;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    firstName?: string;
    profileImageUrl?: string;
  };
}

export default function ChatView() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract chat ID from URL if present
  useEffect(() => {
    const pathParts = location.split("/");
    if (pathParts[2]) {
      const chatId = parseInt(pathParts[2]);
      if (!isNaN(chatId)) {
        setSelectedChatId(chatId);
      }
    }
  }, [location]);

  // Fetch user's chats
  const { data: chats = [], isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/chats", selectedChatId, "messages"],
    enabled: !!selectedChatId,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { chatId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/chats/${data.chatId}/messages`, {
        content: data.content,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats", selectedChatId, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChatId) return;
    
    sendMessageMutation.mutate({
      chatId: selectedChatId,
      content: messageText.trim(),
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const otherParticipant = selectedChat?.participants.find(p => p.id !== user?.id);

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chats</h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search chats..." className="pl-10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-4">No chats yet</div>
              <Button variant="outline" onClick={() => window.location.href = "/discover"}>
                Find Friends to Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chats.map((chat) => {
                const otherUser = chat.participants.find(p => p.id !== user?.id);
                const isSelected = chat.id === selectedChatId;
                
                return (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? "bg-indigo-100 dark:bg-indigo-900" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser?.profileImageUrl} />
                        <AvatarFallback>
                          {otherUser?.firstName?.[0] || otherUser?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {otherUser?.firstName || otherUser?.username}
                          </h3>
                          {chat.unreadCount > 0 && (
                            <span className="bg-indigo-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={otherParticipant?.profileImageUrl} />
                    <AvatarFallback>
                      {otherParticipant?.firstName?.[0] || otherParticipant?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {otherParticipant?.firstName || otherParticipant?.username}
                    </h3>
                    <p className="text-sm text-gray-500">{otherParticipant?.status}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn 
                          ? "bg-indigo-500 text-white" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}>
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? "text-indigo-200" : "text-gray-500"
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  type="submit" 
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}