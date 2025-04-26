// src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { io } from "socket.io-client";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { from: "support", text: "Hi there! How can we help you today?" }
  ]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Connect to socket when component mounts
  useEffect(() => {
    // Connect to the simple chat server (port 3000)
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    // Listen for messages from admin
    newSocket.on("adminMessage", (data) => {
      setMessages((prev) => [...prev, { from: "support", text: data.text, id: data._id }]);
    });

    // Listen for chat history
    newSocket.on("chatHistory", (history) => {
      if (history && history.length > 0) {
        const formattedHistory = history.map(msg => ({
          from: msg.isAdmin ? "support" : "user",
          text: msg.text,
          id: msg._id
        }));
        
        // Keep welcome message and add history
        setMessages(prev => [prev[0], ...formattedHistory]);
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      // Add to local messages
      const newMessage = { from: "user", text: message };
      setMessages((prev) => [...prev, newMessage]);

      // Send to server
      socket.emit("clientMessage", message);
      setMessage("");
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-black p-5 shadow-lg hover:bg-blue-700 focus:outline-none"
        aria-label="Open chat"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-white" />
      </button>

      {/* Chat Popup */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-w-xs rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h4 className="text-lg font-semibold">Live Chat</h4>
            <button
              onClick={() => setOpen(false)}
              className="p-1 focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="p-4">
            {/* Chat messages area */}
            <div className="h-60 overflow-y-auto rounded border px-2 py-1 text-sm text-gray-700">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`mb-2 ${msg.from === "user" ? "text-right" : ""}`}
                >
                  <span 
                    className={`inline-block rounded-lg px-3 py-1.5 ${
                      msg.from === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Input area */}
            <form onSubmit={handleSubmit} className="mt-3 flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow rounded-l border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              />
              <button 
                type="submit"
                className="rounded-r bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 focus:outline-none"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
