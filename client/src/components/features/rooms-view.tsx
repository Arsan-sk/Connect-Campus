import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Plus, 
  Users, 
  Search, 
  Settings, 
  MessageCircle, 
  FileText,
  Calendar,
  MapPin,
  Lock,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: number;
  name: string;
  description?: string;
  subject: string;
  isPrivate: boolean;
  createdById: number;
  memberCount: number;
  createdAt: string;
  creator: {
    id: number;
    username: string;
    firstName?: string;
    profileImageUrl?: string;
  };
}

interface Subject {
  id: number;
  name: string;
  description?: string;
}

export default function RoomsView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    subject: "",
    isPrivate: false,
  });

  // Fetch user's rooms
  const { data: myRooms = [], isLoading: myRoomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms/my"],
  });

  // Fetch public rooms
  const { data: publicRooms = [], isLoading: publicRoomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms/public"],
  });

  // Fetch subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: typeof newRoom) => {
      const response = await apiRequest("POST", "/api/rooms", roomData);
      return response.json();
    },
    onSuccess: (room) => {
      toast({
        title: "Room created successfully!",
        description: `"${room.name}" is ready for collaboration.`,
      });
      setShowCreateDialog(false);
      setNewRoom({ name: "", description: "", subject: "", isPrivate: false });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      setLocation(`/rooms/${room.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/join`);
      return response.json();
    },
    onSuccess: (room) => {
      toast({
        title: "Joined room successfully!",
        description: `Welcome to "${room.name}".`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/my"] });
      setLocation(`/rooms/${room.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name.trim() || !newRoom.subject) return;
    createRoomMutation.mutate(newRoom);
  };

  const filteredPublicRooms = publicRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const RoomCard = ({ room, isJoined = false }: { room: Room; isJoined?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold group-hover:text-indigo-600 transition-colors">
              {room.name}
            </h3>
            {room.isPrivate ? (
              <Lock className="h-4 w-4 text-gray-400" />
            ) : (
              <Globe className="h-4 w-4 text-green-500" />
            )}
          </div>
          <Badge variant="secondary">{room.subject}</Badge>
        </div>
        
        {room.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description}</p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{room.memberCount} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(room.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={room.creator.profileImageUrl} />
              <AvatarFallback className="text-xs">
                {room.creator.firstName?.[0] || room.creator.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">
              by {room.creator.firstName || room.creator.username}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {isJoined ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setLocation(`/rooms/${room.id}`)}>
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Open
                </Button>
                <Button size="sm" variant="ghost">
                  <Settings className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={() => joinRoomMutation.mutate(room.id)}
                disabled={joinRoomMutation.isPending}
              >
                Join Room
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Study Rooms</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Study Room</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="e.g., Calculus Study Group"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={newRoom.subject} 
                  onValueChange={(value) => setNewRoom({ ...newRoom, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsLoading ? (
                      <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                    ) : subjects.length === 0 ? (
                      <SelectItem value="none" disabled>No subjects available</SelectItem>
                    ) : (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Describe what this room is for..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={newRoom.isPrivate}
                  onChange={(e) => setNewRoom({ ...newRoom, isPrivate: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="private">Make this room private</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoomMutation.isPending}>
                  {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Rooms Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Rooms ({myRooms.length})</h2>
        {myRoomsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading your rooms...</div>
        ) : myRooms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No rooms yet</h3>
              <p className="text-gray-500 mb-4">Create your first study room to start collaborating</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => (
              <RoomCard key={room.id} room={room} isJoined />
            ))}
          </div>
        )}
      </div>

      {/* Discover Public Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Discover Public Rooms</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {publicRoomsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading public rooms...</div>
        ) : filteredPublicRooms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium mb-2">
                {searchQuery ? `No rooms found for "${searchQuery}"` : "No public rooms available"}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? "Try a different search term" : "Be the first to create a public room!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPublicRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}