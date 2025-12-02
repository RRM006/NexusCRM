import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  registerUser,
  requestCall,
  acceptCall as socketAcceptCall,
  rejectCall as socketRejectCall,
  cancelCall as socketCancelCall,
  endCall as socketEndCall,
  callCustomer as socketCallCustomer,
  customerAcceptCall as socketCustomerAcceptCall,
} from '../lib/socket';
import { useWebRTC } from '../hooks/useWebRTC';
import toast from 'react-hot-toast';

const CallContext = createContext(null);

export const CALL_STATUS = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  RINGING: 'ringing',
  INCOMING: 'incoming',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
};

export const CallProvider = ({ children }) => {
  const { user, accessToken } = useAuth();
  const { currentCompany, currentRole } = useCompany();
  
  // Call state
  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callInfo, setCallInfo] = useState(null);
  const [onlineAdmins, setOnlineAdmins] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  // WebRTC hook
  const webRTC = useWebRTC();
  
  // Refs for callbacks
  const callIdRef = useRef(null);
  const remoteSocketIdRef = useRef(null);

  // Initialize socket connection when user logs in
  useEffect(() => {
    if (user && accessToken && currentCompany) {
      const socket = initializeSocket(accessToken);
      
      socket.on('connect', () => {
        setIsSocketConnected(true);
        // Register user with socket server
        registerUser({
          userId: user.id,
          userName: user.name,
          role: currentRole,
          companyId: currentCompany.id,
        });
      });

      socket.on('disconnect', () => {
        setIsSocketConnected(false);
      });

      // Setup call event listeners
      setupCallEventListeners(socket);

      return () => {
        disconnectSocket();
        setIsSocketConnected(false);
      };
    }
  }, [user, accessToken, currentCompany, currentRole]);

  // Re-register when company/role changes
  useEffect(() => {
    if (isSocketConnected && user && currentCompany) {
      registerUser({
        userId: user.id,
        userName: user.name,
        role: currentRole,
        companyId: currentCompany.id,
      });
    }
  }, [currentCompany, currentRole, isSocketConnected, user]);

  // Setup socket event listeners for calls
  const setupCallEventListeners = useCallback((socket) => {
    // Customer: Call is ringing
    socket.on('call-ringing', ({ callId }) => {
      setCurrentCallId(callId);
      callIdRef.current = callId;
      setCallStatus(CALL_STATUS.RINGING);
    });

    // INITIATOR receives call-accepted - they should CREATE the offer
    socket.on('call-accepted', ({ callId, adminId, adminName, adminSocketId, recipientId, recipientName, recipientSocketId }) => {
      setCallStatus(CALL_STATUS.CONNECTING);
      
      // Check if this is admin-initiated call (admin calling customer)
      if (recipientSocketId) {
        // Admin initiated the call, customer accepted
        // Admin is INITIATOR → creates offer
        setCallInfo({ recipientId, recipientName, recipientSocketId });
        callIdRef.current = callId;
        remoteSocketIdRef.current = recipientSocketId;
        toast.success(`${recipientName} accepted your call`);
        
        // INITIATOR creates offer
        webRTC.startCall(callId, recipientSocketId);
      } else {
        // Customer initiated the call, admin accepted
        // Customer is INITIATOR → creates offer
        setCallInfo({ adminId, adminName, adminSocketId });
        callIdRef.current = callId;
        remoteSocketIdRef.current = adminSocketId;
        toast.success(`${adminName} accepted your call`);
        
        // INITIATOR creates offer (customer initiated, so customer creates offer)
        webRTC.startCall(callId, adminSocketId);
      }
    });

    // Customer: No one answered
    socket.on('call-ended', ({ callId, reason, duration }) => {
      if (callIdRef.current === callId || currentCallId === callId) {
        if (reason === 'no-answer') {
          toast.error('No admin available to take your call');
        } else if (reason === 'disconnected') {
          toast.error('Call disconnected');
        }
        resetCallState();
        webRTC.cleanup();
      }
    });

    // Incoming call (for Admin receiving customer calls OR Customer receiving admin calls)
    socket.on('incoming-call', ({ callId, callerId, callerName, companyId, isFromAdmin }) => {
      setIncomingCall({
        callId,
        callerId,
        callerName,
        companyId,
        isFromAdmin: isFromAdmin || false,  // Track if call is from admin to customer
      });
      setCallStatus(CALL_STATUS.INCOMING);
      // Play ringtone sound
      playRingtone();
    });

    // Admin: Call was taken by another admin
    socket.on('call-taken', ({ callId, adminName }) => {
      if (incomingCall?.callId === callId) {
        toast(`Call taken by ${adminName}`, { icon: 'ℹ️' });
        setIncomingCall(null);
        setCallStatus(CALL_STATUS.IDLE);
        stopRingtone();
      }
    });

    // Admin: Caller cancelled the call
    socket.on('call-cancelled', ({ callId }) => {
      if (incomingCall?.callId === callId) {
        toast.error('Caller cancelled the call');
        setIncomingCall(null);
        setCallStatus(CALL_STATUS.IDLE);
        stopRingtone();
      }
    });

    // Acceptor receives call-connected (ready for WebRTC)
    // The ACCEPTOR waits to receive an offer from the INITIATOR
    socket.on('call-connected', ({ callId, callerId, callerName, callerSocketId }) => {
      setCurrentCallId(callId);
      callIdRef.current = callId;
      remoteSocketIdRef.current = callerSocketId;
      setCallInfo({ callerId, callerName });
      setCallStatus(CALL_STATUS.CONNECTING);
      setIncomingCall(null);
      stopRingtone();
      
      // Acceptor prepares peer connection to RECEIVE an offer (not create one)
      webRTC.answerCall(callId, callerSocketId);
    });

    // Online admins list
    socket.on('online-admins', ({ admins }) => {
      setOnlineAdmins(admins);
    });

    socket.on('user-online', ({ userId, userName, role }) => {
      if (role === 'ADMIN' || role === 'STAFF') {
        setOnlineAdmins(prev => {
          if (!prev.find(a => a.userId === userId)) {
            return [...prev, { userId, userName, role }];
          }
          return prev;
        });
      }
    });

    socket.on('user-offline', ({ userId }) => {
      setOnlineAdmins(prev => prev.filter(a => a.userId !== userId));
    });

    // Handle call errors
    socket.on('call-error', ({ message }) => {
      toast.error(message);
      resetCallState();
    });
  }, [currentCallId, incomingCall, webRTC]);

  // Ringtone handling
  const ringtoneRef = useRef(null);

  const playRingtone = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      ringtoneRef.current = { oscillator, audioContext };
      
      oscillator.start();
      
      // Beeping pattern
      const beep = () => {
        if (ringtoneRef.current) {
          gainNode.gain.value = gainNode.gain.value > 0 ? 0 : 0.3;
          setTimeout(beep, 500);
        }
      };
      beep();
    } catch (e) {
      console.log('Could not play ringtone:', e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.oscillator.stop();
        ringtoneRef.current.audioContext.close();
      } catch (e) {
        // Ignore errors
      }
      ringtoneRef.current = null;
    }
  };

  // Reset call state
  const resetCallState = useCallback(() => {
    setCallStatus(CALL_STATUS.IDLE);
    setCurrentCallId(null);
    callIdRef.current = null;
    remoteSocketIdRef.current = null;
    setIncomingCall(null);
    setCallInfo(null);
    stopRingtone();
  }, []);

  // Customer: Initiate call to support
  const callSupport = useCallback(() => {
    if (!currentCompany) {
      toast.error('Please select a company first');
      return;
    }
    
    if (callStatus !== CALL_STATUS.IDLE) {
      toast.error('You already have an active call');
      return;
    }

    setCallStatus(CALL_STATUS.REQUESTING);
    requestCall(currentCompany.id);
    toast('Calling support...', { icon: '📞' });
  }, [currentCompany, callStatus]);

  // Admin/Staff: Initiate call to a specific customer
  const callCustomer = useCallback((customerId, customerName) => {
    if (!currentCompany) {
      toast.error('Please select a company first');
      return;
    }
    
    if (callStatus !== CALL_STATUS.IDLE) {
      toast.error('You already have an active call');
      return;
    }

    if (!isSocketConnected) {
      toast.error('Not connected to server');
      return;
    }

    setCallStatus(CALL_STATUS.REQUESTING);
    socketCallCustomer(customerId, currentCompany.id);
    toast(`Calling ${customerName || 'customer'}...`, { icon: '📞' });
  }, [currentCompany, callStatus, isSocketConnected]);

  // Customer: Cancel outgoing call
  const cancelOutgoingCall = useCallback(() => {
    if (currentCallId) {
      socketCancelCall(currentCallId);
    }
    resetCallState();
    webRTC.cleanup();
  }, [currentCallId, resetCallState, webRTC]);

  // Accept incoming call (works for both admin and customer)
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) return;
    
    stopRingtone();
    
    if (incomingCall.isFromAdmin) {
      // Customer accepting call from admin
      socketCustomerAcceptCall(incomingCall.callId);
    } else {
      // Admin accepting call from customer
      socketAcceptCall(incomingCall.callId);
    }
    // WebRTC connection will be initiated after receiving 'call-connected' event
  }, [incomingCall]);

  // Admin: Reject incoming call
  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    
    socketRejectCall(incomingCall.callId);
    setIncomingCall(null);
    setCallStatus(CALL_STATUS.IDLE);
    stopRingtone();
  }, [incomingCall]);

  // End active call
  const endActiveCall = useCallback(() => {
    if (currentCallId) {
      socketEndCall(currentCallId);
    }
    resetCallState();
    webRTC.endCall();
  }, [currentCallId, resetCallState, webRTC]);

  // Get online admins count
  const getOnlineAdminsCount = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected && currentCompany) {
      socket.emit('get-online-admins', { companyId: currentCompany.id });
    }
  }, [currentCompany]);

  const value = {
    // State
    callStatus,
    currentCallId,
    incomingCall,
    callInfo,
    onlineAdmins,
    isSocketConnected,
    
    // WebRTC state
    connectionState: webRTC.connectionState,
    isMuted: webRTC.isMuted,
    isConnecting: webRTC.isConnecting,
    callDuration: webRTC.formattedDuration,
    webRTCError: webRTC.error,
    
    // Actions
    callSupport,
    callCustomer,
    cancelOutgoingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endActiveCall,
    toggleMute: webRTC.toggleMute,
    getOnlineAdminsCount,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    // Return safe defaults instead of throwing
    return {
      callStatus: CALL_STATUS.IDLE,
      currentCallId: null,
      incomingCall: null,
      callInfo: null,
      onlineAdmins: [],
      isSocketConnected: false,
      connectionState: 'new',
      isMuted: false,
      isConnecting: false,
      callDuration: '00:00',
      webRTCError: null,
      callSupport: () => {},
      callCustomer: () => {},
      cancelOutgoingCall: () => {},
      acceptIncomingCall: () => {},
      rejectIncomingCall: () => {},
      endActiveCall: () => {},
      toggleMute: () => {},
      getOnlineAdminsCount: () => {},
    };
  }
  return context;
};

export default CallContext;

