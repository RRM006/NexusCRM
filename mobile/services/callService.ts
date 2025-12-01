import { io, Socket } from 'socket.io-client';
import { WS_URL, SOCKET_EVENTS } from '../constants/config';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';

// WebRTC is not available in Expo Go, so we'll use a mock for now
// For production builds with custom dev client, uncomment the WebRTC imports
// import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices, MediaStream } from 'react-native-webrtc';

class CallService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private isMuted: boolean = false;

  private configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  async initialize(userId: string) {
    this.userId = userId;
    
    try {
      const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.socket?.emit(SOCKET_EVENTS.REGISTER, { userId });
      });

      this.socket.on('connect_error', (error) => {
        console.log('Socket connection error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

    } catch (error) {
      console.log('Failed to initialize call service:', error);
    }
  }

  async startCall(receiverId: string) {
    // In Expo Go, WebRTC is not available
    // This will work in production builds with custom dev client
    console.log('Starting call to:', receiverId);
    
    this.socket?.emit(SOCKET_EVENTS.CALL_REQUEST, {
      to: receiverId,
      from: this.userId,
    });
  }

  async acceptCall(callerId: string, offer: any) {
    console.log('Accepting call from:', callerId);
    
    this.socket?.emit(SOCKET_EVENTS.CALL_ACCEPT, {
      to: callerId,
      from: this.userId,
    });
  }

  async endCall(otherUserId: string) {
    this.socket?.emit(SOCKET_EVENTS.CALL_END, {
      to: otherUserId,
      from: this.userId,
    });
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const callService = new CallService();
