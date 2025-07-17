import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, FolderOpen, Phone, Star } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-secondary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4">EduChat</h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            The ultimate academic collaboration platform. Organize your study materials, 
            connect with classmates, and excel together.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <Users className="w-12 h-12 mb-4 text-secondary" />
              <CardTitle className="text-white">Study Rooms</CardTitle>
              <CardDescription className="text-white/70">
                Create organized study groups with structured file management for each subject
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <MessageSquare className="w-12 h-12 mb-4 text-secondary" />
              <CardTitle className="text-white">Real-time Chat</CardTitle>
              <CardDescription className="text-white/70">
                WhatsApp-like messaging with file sharing, voice notes, and message status
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <FolderOpen className="w-12 h-12 mb-4 text-secondary" />
              <CardTitle className="text-white">File Organization</CardTitle>
              <CardDescription className="text-white/70">
                Smart file categorization by subject, assignments, notes, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <Phone className="w-12 h-12 mb-4 text-secondary" />
              <CardTitle className="text-white">Voice Calls</CardTitle>
              <CardDescription className="text-white/70">
                Connect with study partners through high-quality voice calls
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <Star className="w-12 h-12 mb-4 text-secondary" />
              <CardTitle className="text-white">Achievement System</CardTitle>
              <CardDescription className="text-white/70">
                Share your academic achievements and get recognized by peers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <Users className="w-12 h-12 mb-4 text-secondary" />
              <CardTitle className="text-white">Friend Network</CardTitle>
              <CardDescription className="text-white/70">
                Connect with classmates and build your academic social network
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Study Experience?</h2>
          <p className="text-white/80 mb-8">
            Join thousands of students already using EduChat to excel in their academics
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-primary"
          >
            Start Learning Together
          </Button>
        </div>
      </div>
    </div>
  );
}
