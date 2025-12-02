import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// WebRTC types
interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

interface User {
  userId: string;
  userName: string;
  socketId: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  companyId: string;
}

interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerSocketId: string;
  receiverId: string | null;
  receiverSocketId: string | null;
  companyId: string;
  status: 'ringing' | 'connected' | 'ended';
  startedAt: Date;
  connectedAt?: Date;
  endedAt?: Date;
  dbCallLogId?: string;  // Reference to database CallLog entry
}

// Store connected users and active calls
const connectedUsers = new Map<string, User>();
const activeCalls = new Map<string, CallSession>();
const userSocketMap = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key'
      ) as { userId: string; email: string };
      
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // User registers with their info
    socket.on('register', (data: { 
      userId: string; 
      userName: string; 
      role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
      companyId: string;
    }) => {
      const user: User = {
        userId: data.userId,
        userName: data.userName,
        socketId: socket.id,
        role: data.role,
        companyId: data.companyId
      };

      connectedUsers.set(socket.id, user);
      userSocketMap.set(data.userId, socket.id);

      // Join company room
      socket.join(`company:${data.companyId}`);
      
      // If admin or staff, join admin room for the company (to receive call notifications)
      if (data.role === 'ADMIN' || data.role === 'STAFF') {
        socket.join(`admin:${data.companyId}`);
      }

      console.log(`📝 User registered: ${data.userName} (${data.role}) in company ${data.companyId}`);
      
      // Notify admins of online users
      io.to(`admin:${data.companyId}`).emit('user-online', {
        userId: data.userId,
        userName: data.userName,
        role: data.role
      });
    });

    // Customer initiates call to support
    socket.on('call-request', async (data: { companyId: string }) => {
      const caller = connectedUsers.get(socket.id);
      if (!caller) {
        socket.emit('call-error', { message: 'User not registered' });
        return;
      }

      // Check if caller already has an active call
      const existingCall = Array.from(activeCalls.values()).find(
        call => call.callerId === caller.userId && call.status !== 'ended'
      );
      if (existingCall) {
        socket.emit('call-error', { message: 'You already have an active call' });
        return;
      }

      // Create call session
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const callSession: CallSession = {
        id: callId,
        callerId: caller.userId,
        callerName: caller.userName,
        callerSocketId: socket.id,
        receiverId: null,
        receiverSocketId: null,
        companyId: data.companyId,
        status: 'ringing',
        startedAt: new Date()
      };

      // Create CallLog in database
      try {
        const dbCallLog = await prisma.callLog.create({
          data: {
            companyId: data.companyId,
            callerId: caller.userId,
            sessionId: callId,
            status: 'INITIATED',
            callType: 'AUDIO',
            startTime: new Date()
          }
        });
        callSession.dbCallLogId = dbCallLog.id;
      } catch (err) {
        console.error('Failed to create CallLog:', err);
      }

      activeCalls.set(callId, callSession);

      // Notify all admins in the company about incoming call
      io.to(`admin:${data.companyId}`).emit('incoming-call', {
        callId,
        callerId: caller.userId,
        callerName: caller.userName,
        companyId: data.companyId
      });

      // Notify caller that call is ringing
      socket.emit('call-ringing', { callId });

      console.log(`📞 Call request from ${caller.userName} to admins in company ${data.companyId}`);

      // Auto-end call if not answered within 60 seconds
      setTimeout(async () => {
        const call = activeCalls.get(callId);
        if (call && call.status === 'ringing') {
          call.status = 'ended';
          call.endedAt = new Date();
          
          // Update CallLog in database
          if (call.dbCallLogId) {
            try {
              await prisma.callLog.update({
                where: { id: call.dbCallLogId },
                data: {
                  status: 'MISSED',
                  endTime: new Date()
                }
              });
            } catch (err) {
              console.error('Failed to update CallLog:', err);
            }
          }
          
          socket.emit('call-ended', { callId, reason: 'no-answer' });
          io.to(`admin:${data.companyId}`).emit('call-cancelled', { callId });
          
          activeCalls.delete(callId);
        }
      }, 60000);
    });

    // Admin accepts call
    socket.on('call-accept', async (data: { callId: string }) => {
      const admin = connectedUsers.get(socket.id);
      if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'STAFF')) {
        socket.emit('call-error', { message: 'Only admins/staff can accept calls' });
        return;
      }

      const call = activeCalls.get(data.callId);
      if (!call) {
        socket.emit('call-error', { message: 'Call not found' });
        return;
      }

      if (call.status !== 'ringing') {
        socket.emit('call-error', { message: 'Call is no longer available' });
        return;
      }

      // Update call session
      call.receiverId = admin.userId;
      call.receiverSocketId = socket.id;
      call.status = 'connected';
      call.connectedAt = new Date();

      // Update CallLog in database
      if (call.dbCallLogId) {
        try {
          await prisma.callLog.update({
            where: { id: call.dbCallLogId },
            data: {
              calleeId: admin.userId,
              status: 'CONNECTED',
              answerTime: new Date()
            }
          });
        } catch (err) {
          console.error('Failed to update CallLog:', err);
        }
      }

      // Notify other admins that call was accepted
      socket.to(`admin:${call.companyId}`).emit('call-taken', { 
        callId: data.callId,
        adminName: admin.userName 
      });

      // Notify caller that call was accepted - include adminSocketId for WebRTC
      io.to(call.callerSocketId).emit('call-accepted', {
        callId: data.callId,
        adminId: admin.userId,
        adminName: admin.userName,
        adminSocketId: socket.id  // CRITICAL: Customer needs this for WebRTC signaling
      });

      // Notify admin to start WebRTC connection
      socket.emit('call-connected', {
        callId: data.callId,
        callerId: call.callerId,
        callerName: call.callerName,
        callerSocketId: call.callerSocketId
      });

      console.log(`✅ Call ${data.callId} accepted by ${admin.userName}`);
    });

    // Admin rejects call
    socket.on('call-reject', (data: { callId: string }) => {
      const admin = connectedUsers.get(socket.id);
      if (!admin || admin.role !== 'ADMIN') return;

      const call = activeCalls.get(data.callId);
      if (!call || call.status !== 'ringing') return;

      // Just remove this admin from potential receivers
      // Call continues ringing for other admins
      socket.emit('call-rejected-ack', { callId: data.callId });
    });

    // Customer cancels call
    socket.on('call-cancel', async (data: { callId: string }) => {
      const call = activeCalls.get(data.callId);
      if (!call) return;

      const user = connectedUsers.get(socket.id);
      if (!user || user.userId !== call.callerId) return;

      call.status = 'ended';
      call.endedAt = new Date();

      // Update CallLog in database
      if (call.dbCallLogId) {
        try {
          await prisma.callLog.update({
            where: { id: call.dbCallLogId },
            data: {
              status: 'CANCELLED',
              endTime: new Date()
            }
          });
        } catch (err) {
          console.error('Failed to update CallLog:', err);
        }
      }

      // Notify admins
      io.to(`admin:${call.companyId}`).emit('call-cancelled', { callId: data.callId });

      activeCalls.delete(data.callId);
      console.log(`❌ Call ${data.callId} cancelled by caller`);
    });

    // End active call
    socket.on('call-end', async (data: { callId: string }) => {
      const call = activeCalls.get(data.callId);
      if (!call) return;

      call.status = 'ended';
      call.endedAt = new Date();

      const duration = call.connectedAt 
        ? Math.floor((Date.now() - call.connectedAt.getTime()) / 1000)
        : 0;

      // Update CallLog in database with duration
      if (call.dbCallLogId) {
        try {
          await prisma.callLog.update({
            where: { id: call.dbCallLogId },
            data: {
              status: 'COMPLETED',
              endTime: new Date(),
              durationSec: duration
            }
          });
        } catch (err) {
          console.error('Failed to update CallLog:', err);
        }
      }

      // Notify both parties
      if (call.callerSocketId) {
        io.to(call.callerSocketId).emit('call-ended', { 
          callId: data.callId,
          reason: 'ended',
          duration
        });
      }
      if (call.receiverSocketId) {
        io.to(call.receiverSocketId).emit('call-ended', { 
          callId: data.callId,
          reason: 'ended',
          duration
        });
      }

      activeCalls.delete(data.callId);
      console.log(`📴 Call ${data.callId} ended (duration: ${duration}s)`);
    });

    // WebRTC Signaling: Offer
    socket.on('webrtc-offer', (data: { callId: string; offer: RTCSessionDescriptionInit; to: string }) => {
      io.to(data.to).emit('webrtc-offer', {
        callId: data.callId,
        offer: data.offer,
        from: socket.id
      });
    });

    // WebRTC Signaling: Answer
    socket.on('webrtc-answer', (data: { callId: string; answer: RTCSessionDescriptionInit; to: string }) => {
      io.to(data.to).emit('webrtc-answer', {
        callId: data.callId,
        answer: data.answer,
        from: socket.id
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('webrtc-ice-candidate', (data: { callId: string; candidate: RTCIceCandidateInit; to: string }) => {
      io.to(data.to).emit('webrtc-ice-candidate', {
        callId: data.callId,
        candidate: data.candidate,
        from: socket.id
      });
    });

    // Get online admins/staff for a company
    socket.on('get-online-admins', (data: { companyId: string }) => {
      const admins = Array.from(connectedUsers.values())
        .filter(u => u.companyId === data.companyId && (u.role === 'ADMIN' || u.role === 'STAFF'))
        .map(u => ({ userId: u.userId, userName: u.userName, role: u.role }));
      
      socket.emit('online-admins', { admins });
    });

    // Admin/Staff initiates call to a specific customer
    socket.on('call-customer', async (data: { customerId: string; companyId: string }) => {
      const caller = connectedUsers.get(socket.id);
      if (!caller || (caller.role !== 'ADMIN' && caller.role !== 'STAFF')) {
        socket.emit('call-error', { message: 'Only admins/staff can call customers' });
        return;
      }

      // Check if caller already has an active call
      const existingCall = Array.from(activeCalls.values()).find(
        call => (call.callerId === caller.userId || call.receiverId === caller.userId) && call.status !== 'ended'
      );
      if (existingCall) {
        socket.emit('call-error', { message: 'You already have an active call' });
        return;
      }

      // Find the customer's socket
      const customerSocketId = userSocketMap.get(data.customerId);
      if (!customerSocketId) {
        socket.emit('call-error', { message: 'Customer is not online' });
        return;
      }

      const customerUser = connectedUsers.get(customerSocketId);
      if (!customerUser || customerUser.companyId !== data.companyId) {
        socket.emit('call-error', { message: 'Customer not found or not in your company' });
        return;
      }

      // Create call session
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const callSession: CallSession = {
        id: callId,
        callerId: caller.userId,
        callerName: caller.userName,
        callerSocketId: socket.id,
        receiverId: data.customerId,
        receiverSocketId: customerSocketId,
        companyId: data.companyId,
        status: 'ringing',
        startedAt: new Date()
      };

      // Create CallLog in database
      try {
        const dbCallLog = await prisma.callLog.create({
          data: {
            companyId: data.companyId,
            callerId: caller.userId,
            calleeId: data.customerId,
            sessionId: callId,
            status: 'RINGING',
            callType: 'AUDIO',
            startTime: new Date()
          }
        });
        callSession.dbCallLogId = dbCallLog.id;
      } catch (err) {
        console.error('Failed to create CallLog:', err);
      }

      activeCalls.set(callId, callSession);

      // Notify the customer about incoming call
      io.to(customerSocketId).emit('incoming-call', {
        callId,
        callerId: caller.userId,
        callerName: caller.userName,
        companyId: data.companyId,
        isFromAdmin: true
      });

      // Notify caller that call is ringing
      socket.emit('call-ringing', { callId });

      console.log(`📞 Admin ${caller.userName} calling customer ${customerUser.userName}`);

      // Auto-end call if not answered within 60 seconds
      setTimeout(async () => {
        const call = activeCalls.get(callId);
        if (call && call.status === 'ringing') {
          call.status = 'ended';
          call.endedAt = new Date();
          
          // Update CallLog in database
          if (call.dbCallLogId) {
            try {
              await prisma.callLog.update({
                where: { id: call.dbCallLogId },
                data: {
                  status: 'MISSED',
                  endTime: new Date()
                }
              });
            } catch (err) {
              console.error('Failed to update CallLog:', err);
            }
          }
          
          socket.emit('call-ended', { callId, reason: 'no-answer' });
          io.to(customerSocketId).emit('call-cancelled', { callId });
          
          activeCalls.delete(callId);
        }
      }, 60000);
    });

    // Customer accepts call from admin (reverse flow)
    socket.on('customer-accept-call', async (data: { callId: string }) => {
      const customer = connectedUsers.get(socket.id);
      if (!customer) {
        socket.emit('call-error', { message: 'User not registered' });
        return;
      }

      const call = activeCalls.get(data.callId);
      if (!call) {
        socket.emit('call-error', { message: 'Call not found' });
        return;
      }

      if (call.status !== 'ringing') {
        socket.emit('call-error', { message: 'Call is no longer available' });
        return;
      }

      if (call.receiverId !== customer.userId) {
        socket.emit('call-error', { message: 'This call is not for you' });
        return;
      }

      // Update call session
      call.status = 'connected';
      call.connectedAt = new Date();

      // Update CallLog in database
      if (call.dbCallLogId) {
        try {
          await prisma.callLog.update({
            where: { id: call.dbCallLogId },
            data: {
              status: 'CONNECTED',
              answerTime: new Date()
            }
          });
        } catch (err) {
          console.error('Failed to update CallLog:', err);
        }
      }

      // Notify admin that customer accepted - admin will initiate WebRTC
      io.to(call.callerSocketId).emit('call-accepted', {
        callId: data.callId,
        recipientId: customer.userId,
        recipientName: customer.userName,
        recipientSocketId: socket.id
      });

      // Notify customer to prepare for WebRTC
      socket.emit('call-connected', {
        callId: data.callId,
        callerId: call.callerId,
        callerName: call.callerName,
        callerSocketId: call.callerSocketId
      });

      console.log(`✅ Customer ${customer.userName} accepted call from admin`);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        // End any active calls
        for (const [callId, call] of activeCalls.entries()) {
          if (call.callerSocketId === socket.id || call.receiverSocketId === socket.id) {
            const wasRinging = call.status === 'ringing';
            const wasConnected = call.status === 'connected';
            call.status = 'ended';
            call.endedAt = new Date();

            const duration = call.connectedAt 
              ? Math.floor((Date.now() - call.connectedAt.getTime()) / 1000)
              : 0;

            // Update CallLog in database
            if (call.dbCallLogId) {
              try {
                await prisma.callLog.update({
                  where: { id: call.dbCallLogId },
                  data: {
                    status: wasRinging ? 'CANCELLED' : (wasConnected ? 'COMPLETED' : 'FAILED'),
                    endTime: new Date(),
                    durationSec: duration
                  }
                });
              } catch (err) {
                console.error('Failed to update CallLog:', err);
              }
            }

            // Notify other party
            const otherSocketId = call.callerSocketId === socket.id 
              ? call.receiverSocketId 
              : call.callerSocketId;
            
            if (otherSocketId) {
              io.to(otherSocketId).emit('call-ended', {
                callId,
                reason: 'disconnected',
                duration
              });
            }

            // Notify admins if call was ringing
            if (wasRinging) {
              io.to(`admin:${call.companyId}`).emit('call-cancelled', { callId });
            }

            activeCalls.delete(callId);
          }
        }

        // Notify admins
        io.to(`admin:${user.companyId}`).emit('user-offline', {
          userId: user.userId,
          userName: user.userName
        });

        userSocketMap.delete(user.userId);
        connectedUsers.delete(socket.id);
        
        console.log(`🔌 User disconnected: ${user.userName}`);
      }
    });
  });

  return io;
};
