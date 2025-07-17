import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerName?: string;
  callerImage?: string;
}

export default function CallModal({ 
  isOpen, 
  onClose, 
  callerName = "Sarah Chen",
  callerImage 
}: CallModalProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callStatus, setCallStatus] = useState<"calling" | "connected">("calling");

  useEffect(() => {
    if (!isOpen) {
      setDuration(0);
      setCallStatus("calling");
      return;
    }

    // Simulate call connection after 3 seconds
    const connectTimer = setTimeout(() => {
      setCallStatus("connected");
    }, 3000);

    const durationTimer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(durationTimer);
    };
  }, [isOpen]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 bg-primary text-white border-0">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Avatar className="w-32 h-32 mb-6 border-4 border-white/20">
            <AvatarImage src={callerImage} />
            <AvatarFallback className="bg-primary-foreground text-primary text-2xl">
              {callerName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-2xl font-semibold mb-2">{callerName}</h2>
          <p className="text-white/80 mb-8">
            {callStatus === "calling" ? "Calling..." : formatDuration(duration)}
          </p>
          
          <div className="flex space-x-6">
            <Button
              variant="ghost"
              size="icon"
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            
            {callStatus === "connected" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-full ${
                    isMuted 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-white/20 hover:bg-white/30"
                  } text-white`}
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-full ${
                    isSpeakerOn 
                      ? "bg-secondary hover:bg-secondary/80" 
                      : "bg-white/20 hover:bg-white/30"
                  } text-white`}
                  onClick={toggleSpeaker}
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
