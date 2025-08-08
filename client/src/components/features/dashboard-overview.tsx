import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users, FileText, Search, Plus, ArrowRight } from "lucide-react";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch real data for dashboard stats
  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
  });
  
  const { data: chats = [] } = useQuery({
    queryKey: ["/api/chats"],
  });
  
  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms/my"],
  });
  
  const { data: files = [] } = useQuery({
    queryKey: ["/api/files/my"],
  });

  const quickActions = [
    {
      icon: MessageSquare,
      title: "Start a Chat",
      description: "Message friends or classmates",
      action: () => setLocation("/chat"),
      color: "bg-blue-500",
    },
    {
      icon: Users,
      title: "Create Study Room",
      description: "Set up a new collaborative space",
      action: () => setLocation("/rooms/new"),
      color: "bg-green-500",
    },
    {
      icon: FileText,
      title: "Upload Files",
      description: "Share study materials and documents",
      action: () => setLocation("/files"),
      color: "bg-purple-500",
    },
    {
      icon: Search,
      title: "Find Friends",
      description: "Connect with other students",
      action: () => setLocation("/discover"),
      color: "bg-orange-500",
    },
  ];

  const stats = [
    { label: "Active Chats", value: chats.length.toString(), color: "text-blue-600" },
    { label: "Study Rooms", value: rooms.length.toString(), color: "text-green-600" },
    { label: "Shared Files", value: files.length.toString(), color: "text-purple-600" },
    { label: "Friends", value: friends.length.toString(), color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.firstName || user?.username}! 👋
            </h1>
            <p className="text-indigo-100 mb-4">
              Ready to collaborate and learn with your classmates?
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={action.action}>
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{action.description}</p>
                <Button variant="outline" size="sm" className="w-full group-hover:bg-gray-50">
                  Get Started
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No recent activity yet</p>
              <p className="text-sm">Start by joining a study room or sending a message!</p>
              <Button className="mt-4" onClick={() => setLocation("/chat")}>
                <Plus className="mr-2 h-4 w-4" />
                Start Chatting
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete these steps to set up your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-sm">Create your account</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">2</span>
                </div>
                <span className="text-sm">Add profile picture and bio</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setLocation("/profile")}>
                Do it
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">3</span>
                </div>
                <span className="text-sm">Find your first study buddy</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setLocation("/discover")}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}