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

export default function ChatWidget({ fullPage = false, hideHeader = false, ticketId = null }) {
  const [open, setOpen] = useState(fullPage);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "support", type: "text", text: fullPage ? "Please wait until our admin joins this conversation." : "Hi there! How can we help you today?" },
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
      // Provide a link to communicate with admin after the ticket is created
      setMessages(prev => [...prev, {
        from: 'system',
        type: 'text',
        text: `A support ticket has been created for your issue. Please click here to continue the conversation with our support team.`,
        time: new Date().toLocaleTimeString(),
        isLink: true,
        linkUrl: `/chat/${ticket._id}`
      }]);
    });

    // Handle ticket messages
    sock.on("ticketMessage", (data) => {
      // Only add messages if we are in the full page ticket chat and the ticketId matches,
      // AND the message was not sent by the current user.
      if (fullPage && (ticketId === data.ticketId) && data.sender !== 'user') {
        setMessages(prev => [...prev, {
          from: data.sender === 'admin' ? 'support' : data.sender,
          type: 'text',
          text: data.message,
          time: data.time
        }]);
      }
    });

    // Handle admin joining
    sock.on("adminJoined", (data) => {
      setIsAdminPresent(true);
      // Only show admin joined message on the full page
      if (fullPage) {
        setMessages(prev => [...prev, {
          from: 'system',
          type: 'text',
          text: 'An admin has joined the conversation.',
          time: data.time
        }]);
      }
    });

    // Handle user leaving
    sock.on("userLeft", (data) => {
      // Only show user left message on the full page
      if (fullPage) {
        setMessages(prev => [...prev, {
          from: 'system',
          type: 'text',
          text: 'A user has left the conversation.',
          time: data.time
        }]);
      }
    });

    // Handle ticket status updates
    sock.on("ticketStatusUpdated", (data) => {
      // Only show status updates on the full page
      if (fullPage) {
        setMessages(prev => [...prev, {
          from: 'system',
          type: 'text',
          text: `Ticket status updated to: ${data.status}`,
          time: data.time
        }]);
      }
    });

    // Listen for admin left notification
    sock.on('adminLeft', (data) => {
      setIsAdminPresent(false);
      // Only show admin left message on the full page
      if (fullPage) {
        setMessages(prev => [...prev, {
          from: 'system',
          type: 'text',
          text: 'The admin has left converstation.',
          time: data.time
        }]);
      }
    });

    socketRef.current = sock;
    return () => sock.disconnect();
  }, []);

  // Join ticket room if ticket exists or if ticketId prop is provided
  useEffect(() => {
    if ((currentTicket || ticketId) && socketRef.current) {
      const ticketToJoin = ticketId || currentTicket._id;
      
      // If on the full page and have a ticketId, the user should join the room
      if (fullPage && ticketId) {
        socketRef.current.emit('userJoinTicketRoom', ticketId);
        console.log('Emitting userJoinTicketRoom for ticket:', ticketId);
      } else if (currentTicket) {
           // Existing logic for admin/system joining, if applicable
          socketRef.current.emit('joinTicketRoom', ticketToJoin); // Keep existing for admin/system
      }
      
      // If we have a ticketId prop, set it as the current ticket for display purposes
      if (ticketId && !currentTicket) {
        setCurrentTicket({ _id: ticketId });
      }
    }
  }, [currentTicket, ticketId, fullPage]); // Added fullPage to dependencies

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
    
    // Only allow chat messages in full chat page
    if (fullPage && (currentTicket || ticketId)) {
      console.log('Attempting to emit ticketMessage from full page:', { ticketId: ticketId || currentTicket?._id, message: txt });
      socketRef.current.emit("ticketMessage", {
        ticketId: ticketId || currentTicket._id,
        message: txt,
        isAdmin: false,
        sender: 'user'
      });
    } else {
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
    }
    
    setTextInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    // Only allow chat messages in full chat page
    if (fullPage && (currentTicket || ticketId)) {
      console.log('Attempting to emit ticketMessage from full page:', { ticketId: ticketId || currentTicket?._id, message: textInput });
      socketRef.current.emit('ticketMessage', {
        ticketId: ticketId || currentTicket?._id,
        message: textInput,
        isAdmin: false,
        sender: 'user'
      });
      
      // Add user message to the chat immediately
      setMessages(prev => [...prev, {
        from: 'user',
        type: 'text',
        text: textInput,
        time: new Date().toLocaleTimeString()
      }]);
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
              <div
                key={i}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.from === "user"
                      ? "bg-black text-white"
                      : msg.from === "system"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.isLink ? (
                    <a
                      href={msg.linkUrl}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {msg.text}
                    </a>
                  ) : (
                    msg.text
                  )}
                  {msg.time && (
                    <div className="text-xs opacity-75 mt-1">{msg.time}</div>
                  )}
                </div>
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
