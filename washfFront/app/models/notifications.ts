export type NotificationType = 'client' | 'washer';

export interface NotificationAction {
  type: string;
  target: string;
}

export class Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  actions: NotificationAction[];
  read: boolean;
  type: NotificationType;
  createdAt: Date;

  constructor(data: {
    id: string;
    userId: string;
    title: string;
    body: string;
    actions?: NotificationAction[];
    read?: boolean;
    type: NotificationType;
    createdAt: string | Date;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.title = data.title;
    this.body = data.body;
    this.actions = data.actions ?? [];
    this.read = data.read ?? false;
    this.type = data.type;
    this.createdAt = new Date(data.createdAt);
  }

  markAsRead() {
    this.read = true;
  }

  isForWasher() {
    return this.type === 'washer';
  }

  isForClient() {
    return this.type === 'client';
  }
}