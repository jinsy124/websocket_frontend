"use client";

import { useWebsocket } from "@/hooks/useWebsocket";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquarePlus, LogOut } from "lucide-react";

interface UserWithConversation {
    id: number;
    name: string;
    email: string;
    conversation_id?: number;
    last_message?: string | null;
    updated_at?: string;
}

export default function Home() {
    // Keep websocket connected globally on home page
    const { isConnected, error } = useWebsocket();
    const router = useRouter();
    const [usersList, setUsersList] = useState<UserWithConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserName, setCurrentUserName] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            setLoading(true);

            // Fetch users, conversations, and the current user profile concurrently
            const [usersRes, convsRes, meRes] = await Promise.all([
                api.getAllUsers(),
                api.getConversations(),
                api.getUserMe()
            ]);

            if (usersRes.error === "Unauthorized" || convsRes.error === "Unauthorized" || meRes.error === "Unauthorized") {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            if (meRes.data) {
                setCurrentUserName(meRes.data.name);
            }

            if (usersRes.data && convsRes.data) {
                const combinedList: UserWithConversation[] = usersRes.data.map((user: any) => {
                    const conv = convsRes.data.find((c: any) => c.other_user_id === user.id);
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        conversation_id: conv?.id,
                        last_message: conv?.last_message,
                        updated_at: conv?.updated_at
                    };
                });

                // Sort: active conversations (sorted by date desc) first, then alphabetical by name
                combinedList.sort((a, b) => {
                    if (a.updated_at && b.updated_at) {
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                    }
                    if (a.updated_at) return -1;
                    if (b.updated_at) return 1;
                    return a.name.localeCompare(b.name);
                });

                // Filter out the current user from the list 
                // (assuming meRes.data.id exists, we shouldn't chat with ourselves in this clone)
                const filteredList = combinedList.filter(u => u.id !== meRes.data?.id);

                setUsersList(filteredList);
            }

            setLoading(false);
        };

        fetchData();
    }, [router]);

    const handleUserClick = async (user: UserWithConversation) => {
        setIsNewChatOpen(false); // Close dialog if open
        if (user.conversation_id) {
            router.push(`/chat/${user.conversation_id}`);
        } else {
            // Need to create conversation first
            const { data, error } = await api.createConversation(user.id);
            if (data?.conversation_id) {
                router.push(`/chat/${data.conversation_id}`);
            } else {
                console.error("Failed to create conversation:", error);
                alert("Failed to start chat. Please try again.");
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        router.push("/login");
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return "";
        const date = new Date(isoString + "Z"); // assumes UTC from backend
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 bg-gray-50 dark:bg-zinc-900 shadow-xl items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-green-600 dark:text-green-400 text-3xl font-bold">W</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome to Chats</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Please log in or create a new account to view your messages and connect with others.
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <button
                            onClick={() => router.push("/login")}
                            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => router.push("/register")}
                            className="px-6 py-2 bg-white text-green-600 border border-green-600 font-medium rounded-lg hover:bg-green-50 transition"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Only show users that we have an active conversation with on the main screen
    const activeChats = usersList.filter(u => u.conversation_id);

    return (
        <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-gray-50 dark:bg-zinc-900 shadow-2xl relative border-x border-gray-200 dark:border-zinc-800 overflow-hidden">
            {/* WhatsApp-esque Header */}
            <div className="flex items-center justify-between p-4 bg-green-600 text-white shadow-md z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-green-500 shadow-sm">
                        <AvatarFallback className="bg-white text-green-700 font-bold">
                            {currentUserName ? currentUserName.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-bold tracking-wide">Chats</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-300" : "bg-red-400"}`} />
                            <p className="text-xs text-green-100 font-medium tracking-wide">
                                {currentUserName}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-green-700 rounded-full transition text-green-50"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-100 text-red-700 text-sm border-b border-red-200 flex items-center justify-center">
                    <span>{error}</span>
                </div>
            )}

            {/* Main Active Chats Area */}
            <ScrollArea className="flex-1 bg-white dark:bg-zinc-950">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading chats...</div>
                ) : activeChats.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center mt-20">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <MessageSquarePlus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No chats yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                            Tap the button below to start a new conversation with someone.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {activeChats.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => handleUserClick(user)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition flex items-center gap-4"
                            >
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-bold text-lg">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h2 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {user.name}
                                        </h2>
                                        {user.updated_at && (
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {formatTime(user.updated_at)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-[90%]">
                                        {user.last_message || "Start messaging..."}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* WhatsApp Floating Action Button to start a NEW Chat */}
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                    <button className="absolute bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 z-20">
                        <MessageSquarePlus className="w-6 h-6" />
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
                    <DialogHeader className="p-6 pb-2 border-b dark:border-zinc-800">
                        <DialogTitle>Select Contact</DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 overflow-y-auto">
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800 flex flex-col">
                            {usersList.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No other users found.</div>
                            ) : (
                                usersList.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserClick(user)}
                                        className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition flex items-center gap-4"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 font-medium">
                                                {user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {user.name}
                                            </h2>
                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}