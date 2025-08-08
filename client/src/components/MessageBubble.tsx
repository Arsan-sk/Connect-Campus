import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, Video, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: any;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (fileType === 'application/pdf') return <FileText className="w-5 h-5 text-red-600" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const getFileIconBg = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'bg-purple-100';
    if (fileType.startsWith('video/')) return 'bg-blue-100';
    if (fileType === 'application/pdf') return 'bg-red-100';
    return 'bg-gray-100';
  };

  if (isOwnMessage) {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-white rounded-lg p-3 shadow-sm max-w-xs lg:max-w-sm">
          {message.messageType === 'file' && message.file ? (
            <div className="space-y-2">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className={cn("p-2 rounded-lg", getFileIconBg(message.file.fileType))}>
                    {getFileIcon(message.file.fileType)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{message.file.originalName}</p>
                    <p className="text-xs text-white/70">
                      {(message.file.fileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
          <div className="flex items-center justify-end space-x-1 mt-1">
            <span className="text-xs text-white/70">{formatTime(message.createdAt)}</span>
            <div className="text-xs">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && <span className="text-green-300">✓✓</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2">
      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
        <AvatarImage src={message.sender?.profileImageUrl} />
        <AvatarFallback className="bg-gray-100 text-gray-600">
          {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 max-w-xs lg:max-w-sm">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm text-primary">
              {message.sender?.firstName} {message.sender?.lastName}
            </span>
            <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
          </div>
          
          {message.messageType === 'file' && message.file ? (
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={cn("p-2 rounded-lg", getFileIconBg(message.file.fileType))}>
                    {getFileIcon(message.file.fileType)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{message.file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {(message.file.fileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="text-primary hover:text-primary/80">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
