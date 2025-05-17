// src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  EllipsisVerticalIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { io } from "socket.io-client";
import customerSupportIcon from "../assets/customer-support.png";

export default function ChatWidget({ fullPage = false }) {
  const [open, setOpen] = useState(fullPage);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { from: "support", text: "Hi there! How can we help you today?" },
  ]);
  const socketRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const sock = io("http://localhost:3000");
    socketRef.current = sock;
    sock.on("adminMessage", ({ text, _id }) =>
      setMessages((prev) => [...prev, { from: "support", text, id: _id }])
    );
    sock.on("chatHistory", (history) => {
      if (history?.length) {
        const hist = history.map((msg) => ({
          from: msg.isAdmin ? "support" : "user",
          text: msg.text,
          id: msg._id,
        }));
        setMessages((prev) => [prev[0], ...hist]);
      }
    });
    return () => sock.disconnect();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (txt) => {
    if (!txt.trim() || !socketRef.current) return;
    setMessages((prev) => [...prev, { from: "user", text: txt }]);
    socketRef.current.emit("clientMessage", txt);
    if (txt === message) setMessage("");
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(message);
  };

  const wrapperCls = fullPage
    ? "flex flex-col h-full w-full bg-white border-2 border-gray-300 shadow-xl"
    : "fixed bottom-20 right-4 z-50 w-80 max-w-xs rounded-lg bg-white border-2 border-gray-300 shadow-xl";

  return (
    <>
      {!fullPage && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-black p-4 shadow-lg hover:bg-gray-800 focus:outline-none"
        >
          <img src={customerSupportIcon}
               alt="Help Desk"
               className="h-6 w-6 filter invert" />
        </button>
      )}

      {open && (
        <div className={wrapperCls}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center space-x-2">
              <img src={customerSupportIcon}
                   alt="Avatar"
                   className="h-8 w-8 rounded-full" />
              <span className="font-semibold">Help Desk</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <button><EllipsisVerticalIcon className="h-5 w-5" /></button>
              {!fullPage && (
                <>
                  <button onClick={() => (window.location.href = "/chat")}>
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => setOpen(false)}>
                    <ChevronDownIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 text-sm text-gray-700">
            {messages.map((msg, i) => (
              <div
                key={msg.id ?? i}
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
            <div ref={endRef} />
          </div>

          {/* Input + Image + Send */}
          <form onSubmit={handleSubmit} className="flex border-t px-4 py-2 space-x-2">
            {/* Grouped icon + text input */}
            <div className="flex flex-grow items-center border border-gray-300 rounded-lg overflow-hidden">
              <label className="p-2 hover:bg-gray-100 cursor-pointer">
                <PhotoIcon className="h-6 w-6 text-gray-500" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    /* TODO: handle file e.target.files[0] */
                  }}
                />
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow px-3 py-2 focus:outline-none text-sm"
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 focus:outline-none"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
