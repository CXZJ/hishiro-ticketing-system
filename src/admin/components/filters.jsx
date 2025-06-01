import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from 'lucide-react'

// Filters component for the dashboard page
export function Filters({ status, setStatus, priority, setPriority, onClear }) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        {status !== 'all' && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <X className="h-3 w-3 cursor-pointer" onClick={() => setStatus('all')} />
          </Badge>
        )}
        {priority !== 'all' && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <span>Priority: {priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
            <X className="h-3 w-3 cursor-pointer" onClick={() => setPriority('all')} />
          </Badge>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onClear}>
        Clear All
      </Button>
    </div>
  )
} 