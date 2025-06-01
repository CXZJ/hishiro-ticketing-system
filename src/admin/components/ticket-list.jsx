import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, MessageSquare, Clock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

function getPriorityColor(priority) {
  switch (priority) {
    case "Critical":
      return "bg-red-500 hover:bg-red-600"
    case "High":
      return "bg-orange-500 hover:bg-orange-600"
    case "Medium":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "Low":
      return "bg-green-500 hover:bg-green-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

function getStatusColor(status) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    case "in-progress":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    case "pending":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200"
    case "resolved":
      return "bg-green-100 text-green-800 hover:bg-green-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

export function TicketList({ status, priority, assignee, search }) {
  const [tickets, setTickets] = useState([]);
  const [socket, setSocket] = useState(null);
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  // Helper to filter tickets client-side (if backend doesn't support query params)
  const filterTickets = (tickets) => {
    return tickets.filter(ticket => {
      let statusMatch = status === 'all' ||
        (status === 'open' ? ticket.status === 'new' : ticket.status === status);
      let priorityMatch = priority === 'all' || ticket.priority?.toLowerCase() === priority;
      let searchMatch = !search ||
        ticket._id?.toLowerCase().includes(search.toLowerCase()) ||
        ticket.message?.toLowerCase().includes(search.toLowerCase()) ||
        ticket.userEmail?.toLowerCase().includes(search.toLowerCase());
      return statusMatch && priorityMatch && searchMatch;
    });
  };

  useEffect(() => {
    if (loading) return; // Wait for user loading to complete
    if (!user) {
      // If user is not logged in, redirect to login page
      navigate('/login');
      return;
    }

    // Connect to socket
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Fetch initial tickets
    const fetchTickets = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/tickets', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          if (res.status === 401) {
             // If unauthorized, redirect to login
             navigate('/login');
             return;
          }
          throw new Error(`Failed to fetch tickets: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setTickets(filterTickets(data));
      } catch (err) {
        console.error('Error fetching tickets:', err);
        // Handle other potential errors, maybe show a message to the user
      }
    };

    fetchTickets();

    // Listen for new tickets
    newSocket.on('newTicket', (ticket) => {
      setTickets(prev => {
        if (!prev.find(t => t._id === ticket._id)) {
          const updated = [ticket, ...prev];
          return filterTickets(updated);
        }
        return filterTickets(prev);
      });
    });

    // Listen for ticket updates
    newSocket.on('ticketUpdated', (updatedTicket) => {
      setTickets(prev => {
        const updated = prev.map(ticket => 
          ticket._id === updatedTicket._id ? updatedTicket : ticket
        );
        return filterTickets(updated);
      });
    });

    return () => {
      newSocket.disconnect();
    };
  // re-run when filters change
  }, [user, loading, navigate, status, priority, search]);

  if (loading) {
    // Optionally show a loading indicator while user state is being determined
    return <div>Loading tickets...</div>;
  }

  // After loading, if user is null, the redirect above will handle it,
  // so no need for a separate check here for rendering.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2 w-full"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-xs sm:text-sm">#{ticket._id.substring(0, 8)}</span>
                    <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base">{ticket.subject}</h3>
                  <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                    <span>User ID: {ticket.userId}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link to={`/admin/tickets/${ticket._id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
            </div>
          ))}
          {tickets.length === 0 && ( // Also handles cases where tickets is not an array initially
            <div className="text-center py-8 text-muted-foreground">
              No tickets found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 