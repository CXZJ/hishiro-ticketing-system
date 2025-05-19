// src/components/ChatPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ChatWidget from "./ChatWidget";

export default function ChatPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [showFaq, setShowFaq] = useState(false);
  const [faqs] = useState([
    "What are your shipping options?",
    "How do I track my order?",
    "What is your return policy?",
    "How do I contact customer support?",
  ]);

  const ask = (question) => {
    // Handle FAQ question
    setShowFaq(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* FAQ Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          showFaq ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
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
        </div>
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
          <h1 className="text-xl font-semibold">
            {ticketId ? `Support Ticket #${ticketId}` : 'Help Desk'}
          </h1>

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
        <ChatWidget fullPage hideHeader ticketId={ticketId} />
      </div>
    </div>
  );
}
