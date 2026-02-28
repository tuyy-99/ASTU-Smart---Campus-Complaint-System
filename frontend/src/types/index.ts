export enum UserRole {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin'
}

export enum ComplaintStatus {
  PENDING_REVIEW = 'pending_review',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  profilePhotoUrl?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  createdById?: string;
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | string;
  status: ComplaintStatus;
  studentId: string;
  studentName: string;
  department?: string;
  isAnonymous?: boolean;
  attachments: string[];
  remarks: Remark[];
  resolutionVerification?: {
    status?: 'pending' | 'confirmed' | 'reopened';
    comment?: string;
    verifiedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Remark {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  type: 'status_change' | 'new_remark' | 'general';
  createdAt: string;
}

export interface Analytics {
  totalComplaints: number;
  statusCounts: Record<ComplaintStatus, number>;
  categoryCounts: Record<string, number>;
  resolutionRate: number;
  averageResolutionTime: number; // in hours
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount: number;
  createdAt: string;
}
