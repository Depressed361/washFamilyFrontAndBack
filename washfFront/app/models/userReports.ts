export type UserReportReason =
  | 'harassment'
  | 'scam'
  | 'inappropriate_behavior'
  | 'spam'
  | 'other'
  | 'violation_of_terms';

export type UserReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'resolved';

export class UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: UserReportReason;
  description?: string;
  status: UserReportStatus;
  createdAt: Date;
  reviewedAt?: Date | null;

  constructor(data: {
    id: string;
    reporterId: string;
    reportedUserId: string;
    reason: UserReportReason;
    description?: string;
    status?: UserReportStatus;
    createdAt: string | Date;
    reviewedAt?: string | Date | null;
  }) {
    this.id = data.id;
    this.reporterId = data.reporterId;
    this.reportedUserId = data.reportedUserId;
    this.reason = data.reason;
    this.description = data.description;
    this.status = data.status ?? 'pending';
    this.createdAt = new Date(data.createdAt);
    this.reviewedAt = data.reviewedAt ? new Date(data.reviewedAt) : null;
  }

  markReviewed(date: Date = new Date()) {
    this.status = 'reviewed';
    this.reviewedAt = date;
  }

  markResolved(date: Date = new Date()) {
    this.status = 'resolved';
    this.reviewedAt = date;
  }

  markDismissed(date: Date = new Date()) {
    this.status = 'dismissed';
    this.reviewedAt = date;
  }

  isPending() {
    return this.status === 'pending';
  }
}