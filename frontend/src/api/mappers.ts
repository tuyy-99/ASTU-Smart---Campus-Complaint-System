import { Analytics, Complaint, Notification, Remark, User } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const STATIC_BASE_URL = API_BASE_URL.replace(/\/api$/i, '');

const toId = (value: any): string => String(value?._id || value?.id || '');

const toAttachmentUrl = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `${STATIC_BASE_URL}/${value.replace(/^[\\/]+/, '').replace(/\\/g, '/')}`;
  }

  const rawPath = String(value.path || '');
  if (!rawPath) return '';
  return `${STATIC_BASE_URL}/${rawPath.replace(/^[\\/]+/, '').replace(/\\/g, '/')}`;
};

export const mapUser = (raw: any): User => ({
  id: toId(raw),
  name: raw?.name || '',
  email: raw?.email || '',
  role: raw?.role,
  studentId: raw?.studentId,
  department: raw?.department,
  profilePhotoUrl: raw?.profilePhotoPath ? toAttachmentUrl(raw.profilePhotoPath) : undefined,
  createdAt: raw?.createdAt || new Date().toISOString()
});

const mapRemark = (raw: any): Remark => ({
  id: toId(raw),
  content: raw?.content || raw?.comment || '',
  authorId: String(raw?.authorId || raw?.addedBy?._id || raw?.addedBy || ''),
  authorName: raw?.authorName || raw?.addedBy?.name || 'Staff',
  createdAt: raw?.createdAt || raw?.addedAt || new Date().toISOString()
});

export const mapComplaint = (raw: any): Complaint => {
  const isAnonymous = raw?.isAnonymous === true || raw?.isAnonymous === 'true';
  return {
    id: toId(raw),
    createdById: toId(raw?.createdBy),
    title: raw?.title || '',
    description: raw?.description || '',
    category: raw?.category || '',
    priority: raw?.priority || 'medium',
    status: raw?.status,
    studentId: isAnonymous ? '' : (raw?.createdBy?.studentId || ''),
    studentName: isAnonymous ? 'Anonymous' : (raw?.createdBy?.name || ''),
    department: raw?.department,
    isAnonymous: isAnonymous || false,
    attachments: Array.isArray(raw?.attachments) ? raw.attachments.map(toAttachmentUrl).filter(Boolean) : [],
    remarks: Array.isArray(raw?.remarks) ? raw.remarks.map(mapRemark) : [],
    resolutionVerification: raw?.resolutionVerification
      ? {
          status: raw?.resolutionVerification?.status,
          comment: raw?.resolutionVerification?.comment,
          verifiedAt: raw?.resolutionVerification?.verifiedAt
        }
      : undefined,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || new Date().toISOString()
  };
};

const mapNotificationType = (value: string): Notification['type'] => {
  if (value === 'status_updated') return 'status_change';
  if (value === 'remark_added') return 'new_remark';
  return 'general';
};

export const mapNotification = (raw: any): Notification => ({
  id: toId(raw),
  userId: String(raw?.recipient || ''),
  message: raw?.message || '',
  isRead: Boolean(raw?.isRead),
  type: mapNotificationType(raw?.type),
  createdAt: raw?.createdAt || new Date().toISOString()
});

export const mapAnalytics = (raw: any): Analytics => {
  const statusCounts = raw?.statusCounts || raw?.complaintsByStatus || {};
  const categoryCounts = raw?.categoryCounts || (Array.isArray(raw?.complaintsByCategory)
    ? raw.complaintsByCategory.reduce((acc: Record<string, number>, item: any) => {
      acc[item.category] = item.count;
      return acc;
    }, {})
    : {});

  return {
    totalComplaints: Number(raw?.totalComplaints || 0),
    statusCounts,
    categoryCounts,
    resolutionRate: Number(raw?.resolutionRate || 0),
    averageResolutionTime: Number(raw?.averageResolutionTime || 0)
  };
};
