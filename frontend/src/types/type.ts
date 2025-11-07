export interface Comment {
  id: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: string;
  isCollaboration: boolean;
}

export interface Deliverable {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedById: string;
  timestamp: string;
  note?: string;
  downloadUrl: string;
}

export interface Clarification {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  requestedById: string;
  timestamp: string;
  status: 'pending' | 'answered' | 'resolved';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  assigned_to_name?: string;
  project_id: number;
  project_name: string;
  deadline?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
  deliverables?: Deliverable[];
  clarifications?: Clarification[];
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
}