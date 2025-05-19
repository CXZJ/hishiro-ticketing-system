// src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { io } from "socket.io-client";
import customerSupportIcon from "../assets/customer-support.png";
import { generateBotResponse } from "../services/geminiService";

export default function ChatWidget({ fullPage = false, hideHeader = false }) {
  const [open, setOpen] = useState(fullPage);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "support", type: "text", text: "Hi there! How can we help you today?" },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const [isAdminPresent, setIsAdminPresent] = useState(false);

  // Socket connection
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const sock = io(API_URL, {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    sock.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketError(true);
    });

    sock.on("connect", () => {
      console.log("Socket connected successfully");
      setSocketError(false);
    });

    // Handle ticket creation confirmation
    sock.on("ticketCreated", (ticket) => {
      setCurrentTicket(ticket);
      setMessages(prev => [...prev, {
        from: 'system',
        type: 'text',
        text: 'A support ticket has been created for your issue.',
        time: new Date().toLocaleTimeString()
      }]);
    });

    // Handle ticket messages
    sock.on("ticketMessage", (data) => {
      // Only add the message if it's not from the current user
      if (data.sender !== 'user' || !isAdminPresent) {
        setMessages(prev => [...prev, {
          from: data.sender === 'admin' ? 'support' : 'user',
          type: 'text',
          text: data.message,
          time: data.time
        }]);
      }
    });

    // Handle admin joining
    sock.on("adminJoined", (data) => {
      setIsAdminPresent(true);
      setMessages(prev => [...prev, {
        from: 'system',
        type: 'text',
        text: 'An admin has joined the conversation. The chatbot is now disabled.',
        time: data.time
      }]);
    });

    // Handle user leaving
    sock.on("userLeft", (data) => {
      setMessages(prev => [...prev, {
        from: 'system',
        type: 'text',
        text: 'A user has left the conversation.',
        time: data.time
      }]);
    });

    // Handle ticket status updates
    sock.on("ticketStatusUpdated", (data) => {
      setMessages(prev => [...prev, {
        from: 'system',
        type: 'text',
        text: `Ticket status updated to: ${data.status}`,
        time: data.time
      }]);
    });

    // Listen for admin left notification
    sock.on('adminLeft', (data) => {
      setIsAdminPresent(false);
      setMessages(prev => [...prev, {
        from: 'system',
        type: 'text',
        text: 'The admin has left. The chatbot is now enabled.',
        time: data.time
      }]);
    });

    socketRef.current = sock;
    return () => sock.disconnect();
  }, []);

  // Join ticket room if ticket exists
  useEffect(() => {
    if (currentTicket && socketRef.current) {
      socketRef.current.emit('joinTicketRoom', currentTicket._id);
    }
  }, [currentTicket]);

  // Auto-scroll
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // FAQ listener
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (txt) => {
    if (!txt.trim()) return;
    
    // Add user message
    setMessages((prev) => [...prev, { from: "user", type: "text", text: txt }]);
    
    // Generate bot response
    setIsTyping(true);
    try {
      const response = await generateBotResponse([...messages, { from: "user", type: "text", text: txt }]);
      
      // Add bot response
      setMessages((prev) => [...prev, { from: "support", type: "text", text: response.text }]);
      
      // If ticket is needed, create it
      if (response.needsTicket) {
        // Create ticket through socket
        if (socketRef.current) {
          socketRef.current.emit("createTicket", {
            message: txt,
            botResponse: response.text,
            timestamp: new Date().toISOString()
          });
        }
      } else if (currentTicket) {
        // If we're in a ticket chat, send message to ticket room
        socketRef.current.emit("ticketMessage", {
          ticketId: currentTicket._id,
          message: txt,
          isAdmin: false
        });
      }
    } catch (error) {
      console.error("Error getting bot response:", error);
      setMessages((prev) => [
        ...prev,
        { from: "support", type: "text", text: "I apologize, but I'm having trouble processing your request right now." },
      ]);
    } finally {
      setIsTyping(false);
    }
    
    setTextInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    if (isAdminPresent || currentTicket) {
      // If admin is present or we're in a ticket, send message to ticket room
      socketRef.current.emit('ticketMessage', {
        ticketId: currentTicket?._id,
        message: textInput,
        isAdmin: false,
        sender: 'user'  // Add sender information
      });
    } else {
      sendMessage(textInput);
    }

    setTextInput('');
  };

  // Image upload
  const handleImage = file => {
    const reader = new FileReader();
    reader.onload = () =>
      setMessages(prev => [...prev, { from: "user", type: "image", src: reader.result }]);
    reader.readAsDataURL(file);
  };

  // Lifted panel
  const wrapperCls = fullPage
    ? "w-full flex flex-col flex-1 bg-white border border-gray-300 shadow-inner overflow-hidden"
    : "fixed bottom-4 sm:bottom-6 right-0 z-50 w-full h-1/2 sm:w-96 sm:h-[28rem] rounded-t-xl sm:rounded-xl bg-white border border-gray-300 shadow-xl flex flex-col";

  return (
    <>
      {/* Trigger */}
      {!fullPage && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full bg-black p-4 shadow-lg hover:bg-gray-800 focus:outline-none"
          aria-label="Open chat"
        >
          <img src={customerSupportIcon} alt="Chat" className="h-6 w-6 filter invert" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className={wrapperCls}>
          {/* Header */}
          {!hideHeader && (
            <div className="flex items-center justify-between border-b px-4 py-2 sm:px-6 sm:py-3">
              <span className="text-lg font-semibold">Help Desk</span>
              <div className="flex items-center space-x-2 sm:space-x-3 text-gray-600">
                {!fullPage && (
                  <>
                    <button
                      onClick={() => (window.location.href = "/chat")}
                      aria-label="Fullscreen"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    <button onClick={() => setOpen(false)} aria-label="Close">
                      <ChevronDownIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={msg.from === "user" ? "text-right" : "text-left"}>
                {msg.type === "image" ? (
                  <img
                    src={msg.src}
                    alt="attachment"
                    className="inline-block max-w-xs rounded-lg"
                  />
                ) : (
                  <span
                    className={`inline-block rounded-xl px-3 py-2 sm:px-4 sm:py-2 ${
                      msg.from === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </span>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="mb-2">
                <span className="inline-block rounded-lg px-3 py-1.5 bg-gray-200 text-gray-800">
                  Typing...
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center border-t px-4 py-2 space-x-2 min-w-0"
          >
            <div className="relative p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <PhotoIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 z-10" />
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => {
                  if (e.target.files?.[0]) handleImage(e.target.files[0]);
                  e.target.value = null;
                }}
              />
            </div>

            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={isAdminPresent ? "Chat with admin..." : "Ask me anything..."}
              className="flex-grow min-w-0 bg-gray-100 px-4 py-2 rounded-xl focus:outline-none"
            />

            <button
              type="submit"
              className="flex-shrink-0 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 focus:outline-none disabled:bg-gray-400"
              disabled={isTyping}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
