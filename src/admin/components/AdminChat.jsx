import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function AdminChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [activeTickets, setActiveTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Listen for new tickets
    newSocket.on('newTicket', (ticket) => {
      setActiveTickets(prev => {
        if (!prev.find(t => t._id === ticket._id)) {
          return [...prev, ticket];
        }
        return prev;
      });
    });

    // Listen for ticket messages
    newSocket.on('ticketMessage', (data) => {
      if (selectedTicket && data.ticketId === selectedTicket._id) {
        setMessages(prev => [...prev, {
          _id: Math.random().toString(),
          from: data.sender,
          text: data.message,
          time: data.time
        }]);
      }
    });

    // Listen for admin joined notification
    newSocket.on('adminJoined', (data) => {
      if (selectedTicket && data.ticketId === selectedTicket._id) {
        setMessages(prev => [...prev, {
          _id: Math.random().toString(),
          from: 'system',
          text: 'You joined the conversation',
          time: data.time
        }]);
      }
    });

    // Listen for user left notification
    newSocket.on('userLeft', (data) => {
      if (selectedTicket && data.ticketId === selectedTicket._id) {
        setMessages(prev => [...prev, {
          _id: Math.random().toString(),
          from: 'system',
          text: 'User left the conversation',
          time: data.time
        }]);
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [selectedTicket]);

  // Join ticket room when selected
  useEffect(() => {
    if (selectedTicket && socket) {
      socket.emit('joinTicketRoom', selectedTicket._id);
      setMessages([]); // Clear messages when switching tickets
    }
  }, [selectedTicket, socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && socket && selectedTicket) {
      // Send message to ticket room
      socket.emit('ticketMessage', {
        ticketId: selectedTicket._id,
        message: message,
        isAdmin: true
      });
      
      setMessage('');
    }
  };

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleStatusUpdate = (status) => {
    if (socket && selectedTicket) {
      socket.emit('updateTicketStatus', {
        ticketId: selectedTicket._id,
        status
      });
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Support Tickets</h2>
      
      <div className="flex h-[600px]">
        {/* Active Tickets Sidebar */}
        <div className="w-1/4 border-r pr-4">
          <h3 className="font-medium mb-2">Active Tickets</h3>
          <div className="overflow-y-auto max-h-[550px]">
            {activeTickets.length > 0 ? (
              <ul>
                {activeTickets.map((ticket) => (
                  <li 
                    key={ticket._id} 
                    className={`p-2 hover:bg-gray-100 rounded cursor-pointer ${
                      selectedTicket?._id === ticket._id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleTicketSelect(ticket)}
                  >
                    <div className="text-sm font-medium">
                      Ticket #{ticket._id.substring(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {ticket.status}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No active tickets</p>
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="w-3/4 pl-4 flex flex-col">
          {selectedTicket ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">
                  Ticket #{selectedTicket._id.substring(0, 8)}...
                </h3>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div className="flex-grow overflow-y-auto mb-4 border rounded p-3">
                {messages.length > 0 ? (
                  <>
                    {messages.map((msg) => (
                      <div key={msg._id} className="mb-3">
                        <div className={`flex items-start ${msg.from === 'admin' ? 'justify-end' : ''}`}>
                          <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            msg.from === 'admin' 
                              ? 'bg-blue-500 text-white' 
                              : msg.from === 'system'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-gray-200'
                          }`}>
                            <p className="text-sm font-medium mb-1">
                              {msg.from === 'admin' ? 'You' : 
                               msg.from === 'system' ? 'System' :
                               `User: ${msg.from.substring(0, 8)}...`}
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
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a ticket to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 