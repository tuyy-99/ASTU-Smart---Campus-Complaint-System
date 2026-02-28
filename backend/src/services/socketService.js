const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);

      // Track user's socket connections
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      this.userSockets.get(socket.userId).add(socket.id);

      // Join user-specific room
      socket.join(`user:${socket.userId}`);

      // Join role-specific rooms
      if (socket.userRole === 'admin') {
        socket.join('admins');
      } else if (socket.userRole === 'staff') {
        socket.join('staff');
      }

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        const userSocketSet = this.userSockets.get(socket.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(socket.userId);
          }
        }
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  // Send notification to specific user
  notifyUser(userId, event, data) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Send notification to all admins
  notifyAdmins(event, data) {
    if (!this.io) return;
    this.io.to('admins').emit(event, data);
  }

  // Send notification to all staff
  notifyStaff(event, data) {
    if (!this.io) return;
    this.io.to('staff').emit(event, data);
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.userSockets.size;
  }
}

module.exports = new SocketService();
