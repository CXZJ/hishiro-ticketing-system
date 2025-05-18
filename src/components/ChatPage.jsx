// src/components/ChatPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import ChatWidget from "./ChatWidget";

export default function ChatPage() {
  const navigate = useNavigate();
  const [showFaq, setShowFaq] = useState(false);

  const faqs = [
    "What payment methods are available?",
    "How can I track my order?",
    "When will my items ship?",
    "How do I return an item?",
    "Can I cancel my order?",
    "Do you offer international shipping?",
    "How do I apply a discount code?",
    "What is your warranty policy?",
    // ...more FAQs
  ];

  const ask = q => {
    window.dispatchEvent(new CustomEvent("faq", { detail: q }));
    setShowFaq(false);
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* FAQ Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs
          bg-white p-6 space-y-6
          overflow-y-auto h-full
          transform transition-transform duration-200
          ${showFaq ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:block
        `}
      >
        {/* Close button (mobile only), on left with label */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFaq(false)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <XMarkIcon className="h-6 w-6" />
            <span className="font-medium">Close</span>
          </button>
        </div>

        <h2 className="text-2xl font-semibold">Chat with Support</h2>
        <h3 className="mt-4 text-lg font-medium">FAQs</h3>

        <div className="space-y-2">
          {faqs.map(q => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="block w-full text-left rounded border px-4 py-2 hover:bg-gray-100"
            >
              {q}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            navigate("/tickets/new");
            setShowFaq(false);
          }}
          className="mt-8 w-full rounded bg-black text-white px-4 py-2 hover:bg-gray-800"
        >
          Request Ticket
        </button>
      </aside>

      {/* Backdrop */}
      {showFaq && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={() => setShowFaq(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-white border-b px-4 py-3 md:px-6 md:py-4">
          {/* Hamburger on mobile */}
          <button
            className="md:hidden"
            onClick={() => setShowFaq(true)}
            aria-label="Open FAQs"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>

          {/* Title */}
          <h1 className="text-xl font-semibold">Help Desk</h1>

          {/* Close (X) on right */}
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-black"
            aria-label="Close chat"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        {/* Embedded chat widget */}
        <ChatWidget fullPage hideHeader />
      </div>
    </div>
  );
}
