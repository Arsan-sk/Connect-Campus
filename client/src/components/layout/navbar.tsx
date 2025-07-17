import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  MessageCircle, 
  Users, 
  FileText, 
  Search, 
  Settings, 
  LogOut,
  Plus,
  Menu,
  X
} from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { icon: MessageCircle, label: "Chats", path: "/chat", count: 0 },
    { icon: Users, label: "Rooms", path: "/rooms", count: 0 },
    { icon: FileText, label: "Files", path: "/files", count: 0 },
    { icon: Search, label: "Discover", path: "/discover", count: 0 },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center space-x-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">EduChat</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Search (hidden on mobile) */}
        <div className="hidden lg:flex flex-1 max-w-lg mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for friends, rooms, files..."
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right: Actions and Profile */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center space-x-1"
            onClick={() => setLocation("/rooms/new")}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">New Room</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-indigo-600 text-white text-sm">
                    {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName || user?.username}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.status}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setLocation("/profile")}>
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setLocation(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Mobile Search */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-0"
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}