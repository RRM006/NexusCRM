import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

/**
 * Initializes and returns a socket connection
 * @param {string} token - JWT token for authentication
 * @returns {Socket}
 */
export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error.message);
  });

  return socket;
};

/**
 * Gets the current socket instance
 * @returns {Socket|null}
 */
export const getSocket = () => socket;

/**
 * Disconnects the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Registers user with socket server
 * @param {object} userData - User data including userId, userName, role, companyId
 */
export const registerUser = (userData) => {
  if (socket?.connected) {
    socket.emit('register', userData);
  }
};

/**
 * Initiates a call request
 * @param {string} companyId 
 */
export const requestCall = (companyId) => {
  if (socket?.connected) {
    socket.emit('call-request', { companyId });
  }
};

/**
 * Accepts an incoming call
 * @param {string} callId 
 */
export const acceptCall = (callId) => {
  if (socket?.connected) {
    socket.emit('call-accept', { callId });
  }
};

/**
 * Rejects an incoming call
 * @param {string} callId 
 */
export const rejectCall = (callId) => {
  if (socket?.connected) {
    socket.emit('call-reject', { callId });
  }
};

/**
 * Cancels an outgoing call
 * @param {string} callId 
 */
export const cancelCall = (callId) => {
  if (socket?.connected) {
    socket.emit('call-cancel', { callId });
  }
};

/**
 * Ends an active call
 * @param {string} callId 
 */
export const endCall = (callId) => {
  if (socket?.connected) {
    socket.emit('call-end', { callId });
  }
};

/**
 * Sends WebRTC offer
 * @param {string} callId 
 * @param {RTCSessionDescriptionInit} offer 
 * @param {string} to - Target socket ID
 */
export const sendOffer = (callId, offer, to) => {
  if (socket?.connected) {
    socket.emit('webrtc-offer', { callId, offer, to });
  }
};

/**
 * Sends WebRTC answer
 * @param {string} callId 
 * @param {RTCSessionDescriptionInit} answer 
 * @param {string} to - Target socket ID
 */
export const sendAnswer = (callId, answer, to) => {
  if (socket?.connected) {
    socket.emit('webrtc-answer', { callId, answer, to });
  }
};

/**
 * Sends ICE candidate
 * @param {string} callId 
 * @param {RTCIceCandidateInit} candidate 
 * @param {string} to - Target socket ID
 */
export const sendIceCandidate = (callId, candidate, to) => {
  if (socket?.connected) {
    socket.emit('webrtc-ice-candidate', { callId, candidate, to });
  }
};

/**
 * Gets online admins for a company
 * @param {string} companyId 
 */
export const getOnlineAdmins = (companyId) => {
  if (socket?.connected) {
    socket.emit('get-online-admins', { companyId });
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  registerUser,
  requestCall,
  acceptCall,
  rejectCall,
  cancelCall,
  endCall,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  getOnlineAdmins,
};

