import { useEffect, useState, useRef } from "react";

// @ts-ignore
export const useWebsocket = () => {
    // @ts-ignore
    const [messages, setMessages] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setTimeout(() => setError("No access token found. Please log in."), 0);
            return;
        }

        const socketUrl = `ws://127.0.0.1:8000/ws?token=${token}`;
        const socket = new WebSocket(socketUrl);
        ws.current = socket;

        socket.onopen = () => {
            console.log("WebSocket Connected");
            setIsConnected(true);
            setError(null);
        };

        socket.onmessage = (event) => {
            console.log("Message received:", event.data);
            try {
                const parsed = JSON.parse(event.data);
                // @ts-ignore
                setMessages((prev) => [...prev, parsed]);
            } catch (err) {
                // Not JSON, just push the string
                // @ts-ignore
                setMessages((prev) => [...prev, event.data]);
            }
        };

        socket.onclose = (event) => {
            console.log("WebSocket Disconnected", event.code, event.reason);
            setIsConnected(false);
            if (event.code === 1008) {
                setError(event.reason || "Invalid or missing token.");
            }
        };

        socket.onerror = (err) => {
            console.error("WebSocket Error:", err);
            setError("An error occurred with the WebSocket connection.");
        };

        return () => {
            socket.close();
        };
    }, []);

    const sendMessage = (message: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(message);
        } else {
            console.error("WebSocket is not connected.");
        }
    };

    return { messages, isConnected, error, sendMessage };
};
