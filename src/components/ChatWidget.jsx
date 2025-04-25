// src/components/ChatWidget.jsx
import React, { useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

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
            <div className="h-40 overflow-y-auto rounded border px-2 py-1 text-sm text-gray-700">
              {/* Placeholder content */}
              <p className="mb-2">
                Support: Hi there! How can we help you today?
              </p>
            </div>
            {/* Input area */}
            <div className="mt-3 flex">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-grow rounded-l border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              />
              <button className="rounded-r bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 focus:outline-none">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
