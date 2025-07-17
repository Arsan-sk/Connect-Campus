import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, Save, User, Mail, KeyRound, Bell, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfileView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    status: user?.status || "online",
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Here you would typically upload the image to your server
    toast({
      title: "Image upload",
      description: "Profile picture upload will be implemented soon.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <Button 
          onClick={handleSubmit}
          disabled={updateProfileMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Profile Picture</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="text-xl">
                  {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-4 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
                onClick={() => document.getElementById('profile-image-input')?.click()}
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500">
              Click the camera icon to upload a new profile picture
            </p>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={user?.username || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself, your interests, or what you're studying..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {profileData.bio.length}/200 characters
              </p>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={profileData.status} 
                onValueChange={(value) => setProfileData({ ...profileData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">🟢 Online</SelectItem>
                  <SelectItem value="away">🟡 Away</SelectItem>
                  <SelectItem value="busy">🔴 Busy</SelectItem>
                  <SelectItem value="offline">⚫ Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Account Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <KeyRound className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-gray-500">Last changed 30 days ago</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium">Email Verification</h4>
                <p className="text-sm text-gray-500">
                  {user?.isEmailVerified ? "Verified" : "Not verified"}
                </p>
              </div>
            </div>
            {!user?.isEmailVerified && (
              <Button variant="outline" size="sm">
                Verify Email
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">New Messages</h4>
              <p className="text-sm text-gray-500">Get notified when someone sends you a message</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Friend Requests</h4>
              <p className="text-sm text-gray-500">Get notified when someone sends you a friend request</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Room Invitations</h4>
              <p className="text-sm text-gray-500">Get notified when someone invites you to a study room</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">File Shares</h4>
              <p className="text-sm text-gray-500">Get notified when someone shares a file with you</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-500">Messages Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-500">Rooms Joined</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-500">Files Shared</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-500">Friends</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}