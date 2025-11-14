
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

// types/commentsRatings.ts
export interface Comment {
  id: number;
  content: string;
  author_id: number;
  project_id: number | null;
  task_id: number | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_role: string;
}

export interface Rating {
  id: number;
  rating: number;
  author_id: number;
  project_id: number | null;
  task_id: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_role: string;
}

export interface AverageRating {
  average_rating: number;
  total_ratings: number;
}

export interface CommentsRatingsState {
  // Comments
  comments: Comment[];
  commentsLoading: boolean;
  commentsError: string | null;
  
  // Ratings
  ratings: Rating[];
  averageRatings: Record<string, AverageRating>; // { projectId: { average_rating: number, total_ratings: number } }
  ratingsLoading: boolean;
  ratingsError: string | null;
  
  // Current operations
  addCommentLoading: boolean;
  addRatingLoading: boolean;
}

export interface FetchCommentsParams {
  projectId?: number;
  taskId?: number;
}

export interface AddCommentParams {
  content: string;
  projectId?: number |null;
  taskId?: number;
}

export interface UpdateCommentParams {
  commentId: number;
  content: string;
}

export interface FetchRatingsParams {
  projectId?: number;
  taskId?: number;
}

export interface AddOrUpdateRatingParams {
  rating: number;
  comment?: string;
  projectId?: number| null;
  taskId?: number;
}

export interface AverageRatingParams {
  projectId?: number;
  taskId?: number;
  average_rating: number;
  total_ratings: number;
}