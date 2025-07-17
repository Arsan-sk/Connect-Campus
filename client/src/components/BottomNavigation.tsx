import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Phone, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: "rooms" | "chats" | "calls" | "status";
  onTabChange: (tab: "rooms" | "chats" | "calls" | "status") => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { key: "rooms" as const, label: "Rooms", icon: Users },
    { key: "chats" as const, label: "Chats", icon: MessageSquare },
    { key: "calls" as const, label: "Calls", icon: Phone },
    { key: "status" as const, label: "Status", icon: Star },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant="ghost"
            className={cn(
              "flex-1 py-3 rounded-none flex-col h-auto space-y-1",
              activeTab === key
                ? "text-primary border-t-2 border-primary"
                : "text-gray-600"
            )}
            onClick={() => onTabChange(key)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
