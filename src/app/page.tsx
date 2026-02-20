'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Shield, ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-5xl w-full">
        <Card className="border-none shadow-2xl overflow-hidden">
          {/* Hero Section */}
          <CardHeader className="text-center space-y-6 pb-8 bg-gradient-to-r from-green-600 to-green-500 text-white">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-5xl font-bold mb-4">
                Chat App
              </CardTitle>
              <CardDescription className="text-xl text-green-50">
                Connect with friends and family through instant messaging
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8 p-8">
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Real-time Chat</CardTitle>
                  <CardDescription className="text-base">
                    Send and receive messages instantly with WebSocket technology
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-3">
                    <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Connect Anyone</CardTitle>
                  <CardDescription className="text-base">
                    Start conversations with any registered user instantly
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-3">
                    <Shield className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">Secure & Private</CardTitle>
                  <CardDescription className="text-base">
                    Your messages are protected with JWT authentication
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-6 pt-4">
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Ready to start chatting?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Join thousands of users already connected. Create your account in seconds and start messaging.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() => router.push('/login')}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-lg group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/register')}
                  className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 px-8 h-12 text-lg"
                >
                  Create Account
                </Button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>

            {/* Tech Stack Badge */}
            <div className="pt-6 border-t">
              <div className="flex flex-wrap justify-center gap-3">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Next.js 16
                </div>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  WebSocket
                </div>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                  <Shield className="w-4 h-4 inline mr-1" />
                  JWT Auth
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
