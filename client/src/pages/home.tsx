import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import FileExplorer from "@/components/FileExplorer";
import BottomNavigation from "@/components/BottomNavigation";
import FileUploadModal from "@/components/modals/FileUploadModal";
import CallModal from "@/components/modals/CallModal";

export default function Home() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"rooms" | "chats" | "calls" | "status">("rooms");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(!isMobile);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar - Desktop only or mobile when rooms/chats tab is active */}
      {(!isMobile || activeTab === "rooms" || activeTab === "chats") && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedRoomId={selectedRoomId}
          onRoomSelect={setSelectedRoomId}
          className={isMobile ? "w-full" : "w-80"}
        />
      )}

      {/* Main Chat Area - Show when room is selected or on desktop */}
      {(!isMobile || (selectedRoomId && activeTab === "rooms")) && selectedRoomId && (
        <ChatArea
          roomId={selectedRoomId}
          onFileUpload={() => setIsFileUploadModalOpen(true)}
          onStartCall={() => setIsCallModalOpen(true)}
          onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
          onBack={isMobile ? () => setSelectedRoomId(null) : undefined}
        />
      )}

      {/* File Explorer - Desktop only */}
      {!isMobile && showFileExplorer && selectedRoomId && (
        <FileExplorer
          roomId={selectedRoomId}
          onFileUpload={() => setIsFileUploadModalOpen(true)}
        />
      )}

      {/* Bottom Navigation - Mobile only */}
      {isMobile && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Modals */}
      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
        roomId={selectedRoomId}
      />

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
      />
    </div>
  );
}
