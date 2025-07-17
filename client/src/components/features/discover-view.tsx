import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, UserPlus, MessageCircle, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  status: string;
}

interface FriendRequest {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: string;
  createdAt: string;
  requester: User;
  addressee: User;
}

export default function DiscoverView() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Search users
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<User[]>({
    queryKey: ["/api/users/search", searchQuery],
    enabled: searchQuery.length > 2,
  });

  // Get friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  // Get friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friends/requests"],
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/friends/request", { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent!",
        description: "Your request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/friends/requests/${requestId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted!",
        description: "You are now friends!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/friends/requests/${requestId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The request has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const UserCard = ({ user, showActions = false, isRequest = false, request }: { 
    user: User; 
    showActions?: boolean; 
    isRequest?: boolean; 
    request?: FriendRequest;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profileImageUrl} />
            <AvatarFallback>
              {user.firstName?.[0] || user.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.username
              }
            </h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-gray-600 truncate mt-1">{user.bio}</p>
            )}
            <div className="flex items-center space-x-1 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-500 capitalize">{user.status}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {showActions && (
              <Button
                size="sm"
                onClick={() => sendRequestMutation.mutate(user.id)}
                disabled={sendRequestMutation.isPending}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Friend
              </Button>
            )}
            {isRequest && request && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => acceptRequestMutation.mutate(request.id)}
                  disabled={acceptRequestMutation.isPending}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectRequestMutation.mutate(request.id)}
                  disabled={rejectRequestMutation.isPending}
                >
                  Decline
                </Button>
              </div>
            )}
            {!showActions && !isRequest && (
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const incomingRequests = friendRequests.filter(req => req.status === 'pending');
  const sentRequests = friendRequests.filter(req => req.status === 'sent');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discover & Connect</h1>
        <div className="text-sm text-gray-500">
          {friends.length} friends • {incomingRequests.length} pending requests
        </div>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Find People
          </TabsTrigger>
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            My Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="h-4 w-4 mr-2" />
            Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search for Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by username, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="mt-6 space-y-3">
                {searchLoading ? (
                  <div className="text-center py-8 text-gray-500">Searching...</div>
                ) : searchQuery.length <= 2 ? (
                  <div className="text-center py-8 text-gray-500">
                    Enter at least 3 characters to search for people
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No users found matching "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <UserCard key={user.id} user={user} showActions />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          {friendsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading friends...</div>
          ) : friends.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No friends yet</h3>
                <p className="text-gray-500 mb-4">Start connecting with classmates to build your network</p>
                <Button onClick={() => document.querySelector('[value="search"]')?.click()}>
                  Find People
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <UserCard key={friend.id} user={friend} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {requestsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : (
            <>
              {incomingRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Incoming Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {incomingRequests.map((request) => (
                      <UserCard 
                        key={request.id} 
                        user={request.requester} 
                        isRequest 
                        request={request} 
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {sentRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sent Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={request.addressee.profileImageUrl} />
                            <AvatarFallback>
                              {request.addressee.firstName?.[0] || request.addressee.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {request.addressee.firstName || request.addressee.username}
                            </p>
                            <p className="text-sm text-gray-500">
                              Sent {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-yellow-600 font-medium">Pending</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {incomingRequests.length === 0 && sentRequests.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No pending requests</h3>
                    <p className="text-gray-500">Friend requests will appear here</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}