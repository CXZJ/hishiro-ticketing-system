import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function AdminChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to the simple chat server (port 3000)
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Listen for messages from clients
    newSocket.on('adminMessage', (data) => {
      setMessages((prev) => [...prev, data]);
      
      // Add user to active users if not already there
      if (data.from && data.from !== 'admin') {
        setActiveUsers((prev) => {
          if (!prev.includes(data.from)) {
            return [...prev, data.from];
          }
          return prev;
        });
      }
    });

    // Listen for chat history
    newSocket.on('chatHistory', (history) => {
      if (history && history.length > 0) {
        setMessages(history.map(msg => ({
          _id: msg._id,
          from: msg.isAdmin ? 'admin' : msg.user,
          text: msg.text,
          time: msg.time || msg.createdAt
        })));
        
        // Extract unique users from history
        const users = [...new Set(history
          .filter(msg => !msg.isAdmin)
          .map(msg => msg.user))];
          
        setActiveUsers(users);
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      // Send response to all clients
      socket.emit('adminMessage', {
        from: 'admin',
        text: message,
        time: new Date().toLocaleTimeString()
      });
      
      // Message will be added to state when server broadcasts it back
      setMessage('');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Live Support Chat</h2>
      
      <div className="flex h-[600px]">
        {/* Active Users Sidebar */}
        <div className="w-1/4 border-r pr-4">
          <h3 className="font-medium mb-2">Active Users</h3>
          <div className="overflow-y-auto max-h-[550px]">
            {activeUsers.length > 0 ? (
              <ul>
                {activeUsers.map((userId) => (
                  <li key={userId} className="p-2 hover:bg-gray-100 rounded">
                    User: {userId.substring(0, 8)}...
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No active users</p>
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="w-3/4 pl-4 flex flex-col">
          <div className="flex-grow overflow-y-auto mb-4 border rounded p-3">
            {messages.length > 0 ? (
              <>
                {messages.map((msg) => (
                  <div key={msg._id || Math.random().toString()} className="mb-3">
                    <div className={`flex items-start ${msg.from === 'admin' ? 'justify-end' : ''}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        msg.from === 'admin' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200'
                      }`}>
                        <p className="text-sm font-medium mb-1">
                          {msg.from === 'admin' ? 'You' : `User: ${msg.from.substring(0, 8)}...`}
                        </p>
                        <p>{msg.text}</p>
                        <p className="text-xs opacity-75 mt-1">{msg.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <p className="text-gray-500 text-center mt-4">No messages yet</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response..."
              className="flex-grow border rounded-l px-3 py-2"
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded-r"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 