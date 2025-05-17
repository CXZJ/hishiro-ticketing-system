import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import ChatWidget from "./ChatWidget";

export default function ChatPage() {
  const navigate = useNavigate();
  const faqs = [
    "Apa metode pembayaran yang tersedia?",
    "Bagaimana cara melacak pesanan?",
    "Kapan barang saya dikirim?",
    "Bagaimana cara mengembalikan barang?",
  ];

  // fire into ChatWidget
  const ask = (q) => window.dispatchEvent(new CustomEvent("faq", { detail: q }));

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-1/4 border-r bg-gray-50 p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold">Chat with Support</h2>
        </div>

        <h3 className="font-semibold">FAQ</h3>
        {faqs.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            className="block w-full text-left rounded border px-3 py-2 hover:bg-gray-100"
          >
            {q}
          </button>
        ))}

        <button
          onClick={() => (window.location.href = "/tickets/new")}
          className="mt-6 w-full rounded bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
        >
          Request Ticket
        </button>
      </aside>

      {/* Full-page chat */}
      <div className="flex-grow">
        <ChatWidget fullPage />
      </div>
    </div>
  );
}
