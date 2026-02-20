"use client";

import { useWebsocket } from "@/hooks/useWebsocket";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender_name: string;
    text: string;
    created_at: string;
    is_own: boolean;
}

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = parseInt(params.conversationId as string);

    // Track state of current user and messages
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(true);

    const { messages: wsMessages, isConnected, error: wsError, sendMessage } = useWebsocket();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Optional: Get basic details if we decide to fetch the conversation object specifically,
    // For now we rely on the messages for sender names.

    useEffect(() => {
        const initChat = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                router.push("/login");
                return;
            }

            // 1. Get Me (to know my own ID to correctly display left vs right UI)
            const meRes = await api.getUserMe();
            if (meRes.data) {
                setCurrentUserId(meRes.data.id);
            }

            // 2. Load historic messages
            const msgRes = await api.getConversationMessages(conversationId);
            if (msgRes.error === "Unauthorized") {
                localStorage.removeItem("access_token");
                router.push("/login");
                return;
            }

            if (msgRes.data) {
                setMessages(msgRes.data);
            }

            setLoading(false);
        };

        if (conversationId) {
            initChat();
        }
    }, [conversationId, router]);

    // Synchronize incoming websocket messages with our local UI state
    useEffect(() => {
        if (wsMessages.length > 0) {
            const lastMessage = wsMessages[wsMessages.length - 1];

            // Only push if it belongs to this active conversation
            if (typeof lastMessage === "object" && lastMessage.conversation_id === conversationId) {
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === lastMessage.id)) return prev;

                    return [...prev, {
                        ...lastMessage,
                        // Ensure the UI calculates ownership appropriately based on who is logged in
                        is_own: lastMessage.sender_id === currentUserId
                    }];
                });
            }
        }
    }, [wsMessages, conversationId, currentUserId]);

    // Scroll to bottom whenever messages update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !isConnected) return;

        // Send payload dynamically 
        const payload = {
            conversation_id: conversationId,
            text: inputValue
        };

        sendMessage(JSON.stringify(payload));
        setInputValue("");
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";
        const date = new Date(isoString + "Z");
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
                <p className="text-gray-500">Loading chat...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-gray-50 dark:bg-zinc-900 shadow-2xl relative border-x border-gray-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center p-4 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 shadow-sm z-10 sticky top-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 h-8 w-8"
                    onClick={() => router.push("/home")}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <Avatar className="h-10 w-10 mr-3">
                    {/* Displaying fallbacks since we don't have images in DB */}
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {/* Try to find the other user's name from historic messages */}
                        {messages.find(m => !m.is_own)?.sender_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                        {messages.find(m => !m.is_own)?.sender_name || "Chat"}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-500 dark:text-gray-400">
                            {isConnected ? "Connected" : "Reconnecting..."}
                        </span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
                ref={scrollRef}
            >
                {wsError && (
                    <div className="bg-red-100 text-red-700 p-2 text-xs rounded mb-4 text-center">
                        {wsError}
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center pt-20">
                        <div className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-2 rounded-lg text-sm">
                            Wave to say hi! 👋
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pb-4">
                        {messages.map((msg, index) => {
                            const isOwn = msg.is_own;

                            // Optional: Grouping messages logically
                            const showName = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                                >
                                    {showName && (
                                        <span className="text-xs text-gray-400 mb-1 ml-1 font-medium">
                                            {msg.sender_name}
                                        </span>
                                    )}
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl relative shadow-sm ${isOwn
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                                            }`}
                                    >
                                        <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                                        <span
                                            className={`text-[10px] block text-right mt-1 opacity-70 ${isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                                }`}
                                        >
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 shrink-0">
                <form
                    onSubmit={handleSend}
                    className="flex gap-2 items-end"
                >
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        disabled={!isConnected}
                        className="flex-1 rounded-full bg-gray-100 dark:bg-zinc-900 border-transparent focus-visible:ring-blue-500 focus-visible:ring-offset-0 px-4 py-6"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!isConnected || !inputValue.trim()}
                        className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700 shrink-0 shadow-md transition-all active:scale-95"
                    >
                        <Send className="h-5 w-5 ml-1" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
