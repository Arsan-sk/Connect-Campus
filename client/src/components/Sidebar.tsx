import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, Search, Plus, UserPlus, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: "rooms" | "chats" | "calls" | "status";
  onTabChange: (tab: "rooms" | "chats" | "calls" | "status") => void;
  selectedRoomId: number | null;
  onRoomSelect: (roomId: number) => void;
  className?: string;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  selectedRoomId,
  onRoomSelect,
  className
}: SidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
    enabled: !!user,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    enabled: !!user && activeTab === "chats",
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const filteredRooms = rooms.filter((room: any) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("flex flex-col bg-white border-r border-gray-200", className)}>
      {/* User Profile Header */}
      <div className="p-4 border-b border-gray-200 bg-primary text-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12 border-2 border-white/20">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-primary-foreground text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm text-white/80">{user?.status || "Student"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 py-3 px-4 rounded-none font-medium",
            activeTab === "rooms"
              ? "text-primary border-b-2 border-primary bg-blue-50"
              : "text-gray-600 hover:text-primary"
          )}
          onClick={() => onTabChange("rooms")}
        >
          <Users className="w-4 h-4 mr-2" />
          Rooms
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 py-3 px-4 rounded-none font-medium",
            activeTab === "chats"
              ? "text-primary border-b-2 border-primary bg-blue-50"
              : "text-gray-600 hover:text-primary"
          )}
          onClick={() => onTabChange("chats")}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chats
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Rooms/Chats List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "rooms" && (
          <>
            {filteredRooms.map((room: any) => (
              <div
                key={room.id}
                className={cn(
                  "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                  selectedRoomId === room.id && "bg-blue-50 border-blue-200"
                )}
                onClick={() => onRoomSelect(room.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={room.imageUrl} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {room.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{room.name}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(room.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {room.description || "No recent messages"}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        12 files
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        8 members
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === "chats" && (
          <>
            {friends.map((friend: any) => (
              <div
                key={friend.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={friend.profileImageUrl} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {friend.firstName?.[0]}{friend.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">
                        {friend.firstName} {friend.lastName}
                      </h3>
                      <span className="text-xs text-gray-500">2:34 PM</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      Hey, how's the assignment going?
                    </p>
                  </div>
                  <div className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                    2
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          {activeTab === "rooms" && (
            <Button className="flex-1 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Room
            </Button>
          )}
          <Button variant="outline" size="icon">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
