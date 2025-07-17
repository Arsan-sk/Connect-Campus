import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Users, FileText, Search, LogOut } from "lucide-react";

export default function Home() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.firstName?.[0] || user.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Welcome back, {user.firstName || user.username}!
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to collaborate and learn?
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <MessageSquare className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Start conversations with classmates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Study Rooms</CardTitle>
              <CardDescription>
                Join or create study groups
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Files</CardTitle>
              <CardDescription>
                Organize and share study materials
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Search className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Discover</CardTitle>
              <CardDescription>
                Find friends and study groups
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest interactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity yet</p>
                <p className="text-sm">Start by joining a study room or sending a message!</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Manage your account and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Username:</span>
                <span className="text-gray-600">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">{user.email || "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span className="text-gray-600">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : "Not provided"
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-medium">{user.status}</span>
              </div>
              <div className="pt-4">
                <Button className="w-full" variant="outline">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}