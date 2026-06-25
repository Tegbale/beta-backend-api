export const SocketEvents = {
  // connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // messages
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',

  // notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_COUNT: 'notification:count',

  // presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
