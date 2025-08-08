import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ChatView from "@/components/features/chat-view";
import RoomsView from "@/components/features/rooms-view";
import FilesView from "@/components/features/files-view";
import DiscoverView from "@/components/features/discover-view";
import ProfileView from "@/components/features/profile-view";
import DashboardOverview from "@/components/features/dashboard-overview";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Home() {
  const { user } = useAuth();
  const [location] = useLocation();

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

  // Route content based on URL
  const renderContent = () => {
    if (location.startsWith("/chat")) {
      return (
        <ErrorBoundary>
          <ChatView />
        </ErrorBoundary>
      );
    } else if (location.startsWith("/rooms")) {
      return <RoomsView />;
    } else if (location.startsWith("/files")) {
      return <FilesView />;
    } else if (location.startsWith("/discover") || location.startsWith("/friends")) {
      return <DiscoverView />;
    } else if (location.startsWith("/profile")) {
      return <ProfileView />;
    } else {
      return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}