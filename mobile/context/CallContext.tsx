import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { callService } from '../services/callService';
import { useAuth } from './AuthContext';
import { SOCKET_EVENTS } from '../constants/config';

interface CallState {
  isInCall: boolean;
  isCalling: boolean;
  isReceivingCall: boolean;
  callerId?: string;
  callerName?: string;
  receiverId?: string;
  receiverName?: string;
  isMuted: boolean;
  callDuration: number;
  offer?: any;
}

interface CallContextType extends CallState {
  startCall: (receiverId: string, receiverName: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isCalling: false,
    isReceivingCall: false,
    isMuted: false,
    callDuration: 0,
  });

  const [callInterval, setCallInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) {
      initializeCallService();
    }

    return () => {
      if (callInterval) {
        clearInterval(callInterval);
      }
      callService.disconnect();
    };
  }, [user?.id]);

  const initializeCallService = async () => {
    if (!user) return;

    try {
      await callService.initialize(user.id);
      const socket = callService.getSocket();

      if (socket) {
        socket.on(SOCKET_EVENTS.INCOMING_CALL, handleIncomingCall);
        socket.on(SOCKET_EVENTS.CALL_CONNECTED, handleCallConnected);
        socket.on(SOCKET_EVENTS.CALL_END, handleCallEnd);
      }
    } catch (error) {
      console.log('Failed to initialize call service:', error);
    }
  };

  const handleIncomingCall = (data: any) => {
    setCallState((prev) => ({
      ...prev,
      isReceivingCall: true,
      callerId: data.from,
      callerName: data.callerName,
      offer: data.offer,
    }));
  };

  const handleCallConnected = () => {
    setCallState((prev) => ({
      ...prev,
      isInCall: true,
      isCalling: false,
      isReceivingCall: false,
    }));

    const interval = setInterval(() => {
      setCallState((prev) => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);

    setCallInterval(interval);
  };

  const handleCallEnd = () => {
    if (callInterval) {
      clearInterval(callInterval);
    }

    setCallState({
      isInCall: false,
      isCalling: false,
      isReceivingCall: false,
      isMuted: false,
      callDuration: 0,
    });
  };

  const startCall = async (receiverId: string, receiverName: string) => {
    try {
      setCallState((prev) => ({
        ...prev,
        isCalling: true,
        receiverId,
        receiverName,
      }));

      await callService.startCall(receiverId);
    } catch (error) {
      console.log('Error starting call:', error);
      setCallState((prev) => ({
        ...prev,
        isCalling: false,
      }));
    }
  };

  const acceptCall = async () => {
    try {
      if (!callState.callerId || !callState.offer) return;

      await callService.acceptCall(callState.callerId, callState.offer);
      
      setCallState((prev) => ({
        ...prev,
        isReceivingCall: false,
        isInCall: true,
      }));
    } catch (error) {
      console.log('Error accepting call:', error);
      setCallState((prev) => ({
        ...prev,
        isReceivingCall: false,
      }));
    }
  };

  const rejectCall = () => {
    if (callState.callerId) {
      callService.endCall(callState.callerId);
    }
    
    setCallState((prev) => ({
      ...prev,
      isReceivingCall: false,
      callerId: undefined,
      callerName: undefined,
      offer: undefined,
    }));
  };

  const endCall = () => {
    const otherUserId = callState.receiverId || callState.callerId;
    if (otherUserId) {
      callService.endCall(otherUserId);
    }

    if (callInterval) {
      clearInterval(callInterval);
    }

    setCallState({
      isInCall: false,
      isCalling: false,
      isReceivingCall: false,
      isMuted: false,
      callDuration: 0,
    });
  };

  const toggleMute = () => {
    const isMuted = callService.toggleMute();
    setCallState((prev) => ({
      ...prev,
      isMuted,
    }));
  };

  return (
    <CallContext.Provider
      value={{
        ...callState,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};
