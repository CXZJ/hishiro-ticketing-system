// src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { io } from "socket.io-client";
import customerSupportIcon from "../assets/customer-support.png";

export default function ChatWidget({ fullPage = false, hideHeader = false }) {
  const [open, setOpen] = useState(fullPage);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "support", type: "text", text: "Hi there! How can we help you today?" },
  ]);

  const socketRef = useRef(null);
  const endRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const sock = io("http://localhost:3000");
    socketRef.current = sock;
    sock.on("adminMessage", ({ text, _id }) =>
      setMessages(prev => [...prev, { from: "support", type: "text", text, id: _id }])
    );
    sock.on("chatHistory", history => {
      if (history?.length) {
        const hist = history.map(m => ({
          from: m.isAdmin ? "support" : "user",
          type: "text",
          text: m.text,
          id: m._id,
        }));
        setMessages(prev => [prev[0], ...hist]);
      }
    });
    return () => sock.disconnect();
  }, []);

  // Auto-scroll
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // Send helper
  const sendText = useCallback(txt => {
    if (!txt.trim()) return;
    setMessages(prev => [...prev, { from: "user", type: "text", text: txt }]);
    socketRef.current?.emit("clientMessage", txt);
    setTextInput("");
  }, []);

  // FAQ listener
  useEffect(() => {
    const onFaq = e => sendText(e.detail);
    window.addEventListener("faq", onFaq);
    return () => window.removeEventListener("faq", onFaq);
  }, [sendText]);

  // Form submit
  const handleSubmit = e => {
    e.preventDefault();
    sendText(textInput);
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
              placeholder="Type your message…"
              className="flex-grow min-w-0 bg-gray-100 px-4 py-2 rounded-xl focus:outline-none"
            />

            <button
              type="submit"
              className="flex-shrink-0 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 focus:outline-none"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
