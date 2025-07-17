import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, Users, FileText, MessageSquare, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EduChat</h1>
          </div>
          <div className="space-x-4">
            <Link href="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Academic Collaboration
            <span className="text-indigo-600"> Made Simple</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Connect with classmates, organize study materials, and collaborate seamlessly 
            in dedicated study rooms. EduChat brings the best of WhatsApp to academic learning.
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Learning Together
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Real-time Messaging</CardTitle>
              <CardDescription>
                Chat instantly with classmates and study groups using our WhatsApp-inspired interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Study Rooms</CardTitle>
              <CardDescription>
                Create organized spaces for different subjects with role-based access control
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>File Organization</CardTitle>
              <CardDescription>
                Share and organize study materials by subject and category for easy discovery
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Built for speed with instant message delivery and real-time collaboration
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your academic conversations and files are protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Academic Focus</CardTitle>
              <CardDescription>
                Designed specifically for educational use with features that enhance learning
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Study Experience?</h3>
              <p className="text-indigo-100 mb-6">
                Join thousands of students already using EduChat to collaborate, learn, and succeed together.
              </p>
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="text-indigo-600">
                  Create Your Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 EduChat. Empowering academic collaboration.</p>
        </div>
      </footer>
    </div>
  );
}