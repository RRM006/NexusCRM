import { useState, useRef, useCallback, useEffect } from 'react';
import {
  createPeerConnection,
  getLocalAudioStream,
  addLocalStreamToPeerConnection,
  createOffer,
  createAnswer,
  setRemoteAnswer,
  addIceCandidate,
  stopMediaStream,
  closePeerConnection,
  playRemoteAudio,
  toggleMute,
} from '../lib/webrtc';
import { getSocket, sendOffer, sendAnswer, sendIceCandidate } from '../lib/socket';

/**
 * Custom hook for managing WebRTC voice calls
 */
export const useWebRTC = () => {
  const [connectionState, setConnectionState] = useState('new');
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callIdRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);  // Queue ICE candidates until remote description is set

  // Start call duration timer
  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // Stop call duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Setup event listeners for socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleWebRTCOffer = async ({ callId, offer, from }) => {
      if (callIdRef.current !== callId) return;
      
      try {
        remoteSocketIdRef.current = from;
        const pc = peerConnectionRef.current;
        if (pc) {
          const answer = await createAnswer(pc, offer);
          sendAnswer(callId, answer, from);
          
          // Apply any queued ICE candidates now that remote description is set
          if (pendingIceCandidatesRef.current.length > 0) {
            console.log(`Applying ${pendingIceCandidatesRef.current.length} queued ICE candidates`);
            for (const candidate of pendingIceCandidatesRef.current) {
              await addIceCandidate(pc, candidate);
            }
            pendingIceCandidatesRef.current = [];
          }
        }
      } catch (err) {
        console.error('Error handling offer:', err);
        setError('Failed to process call offer');
      }
    };

    const handleWebRTCAnswer = async ({ callId, answer, from }) => {
      if (callIdRef.current !== callId) return;
      
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await setRemoteAnswer(pc, answer);
          
          // Apply any queued ICE candidates now that remote description is set
          if (pendingIceCandidatesRef.current.length > 0) {
            console.log(`Applying ${pendingIceCandidatesRef.current.length} queued ICE candidates`);
            for (const candidate of pendingIceCandidatesRef.current) {
              await addIceCandidate(pc, candidate);
            }
            pendingIceCandidatesRef.current = [];
          }
        }
      } catch (err) {
        console.error('Error handling answer:', err);
        setError('Failed to establish connection');
      }
    };

    const handleICECandidate = async ({ callId, candidate, from }) => {
      if (callIdRef.current !== callId) return;
      
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          // Queue ICE candidates if remote description not yet set
          if (!pc.remoteDescription) {
            console.log('Queuing ICE candidate (remote description not set yet)');
            pendingIceCandidatesRef.current.push(candidate);
            return;
          }
          await addIceCandidate(pc, candidate);
        }
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    };

    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleICECandidate);

    return () => {
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleICECandidate);
    };
  }, []);

  // Initialize peer connection with proper event handlers
  const initializePeerConnection = useCallback((callId, remoteSocketId) => {
    callIdRef.current = callId;
    remoteSocketIdRef.current = remoteSocketId;

    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketIdRef.current) {
        sendIceCandidate(callId, event.candidate, remoteSocketIdRef.current);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        startDurationTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnecting(false);
        stopDurationTimer();
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
    };

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('Remote track received');
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      remoteAudioRef.current = playRemoteAudio(remoteStream);
    };

    return pc;
  }, [startDurationTimer, stopDurationTimer]);

  // Start a call (caller side - creates offer)
  const startCall = useCallback(async (callId, remoteSocketId) => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get local audio stream
      const localStream = await getLocalAudioStream();
      localStreamRef.current = localStream;

      // Initialize peer connection
      const pc = initializePeerConnection(callId, remoteSocketId);

      // Add local stream to peer connection
      addLocalStreamToPeerConnection(pc, localStream);

      // Create and send offer
      const offer = await createOffer(pc);
      sendOffer(callId, offer, remoteSocketId);

    } catch (err) {
      console.error('Error starting call:', err);
      setError(err.message || 'Failed to start call');
      setIsConnecting(false);
      cleanup();
    }
  }, [initializePeerConnection]);

  // Answer a call (receiver side - waits for offer)
  const answerCall = useCallback(async (callId, remoteSocketId) => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get local audio stream
      const localStream = await getLocalAudioStream();
      localStreamRef.current = localStream;

      // Initialize peer connection
      const pc = initializePeerConnection(callId, remoteSocketId);

      // Add local stream to peer connection
      addLocalStreamToPeerConnection(pc, localStream);

      // Peer connection is now ready to receive offer

    } catch (err) {
      console.error('Error answering call:', err);
      setError(err.message || 'Failed to answer call');
      setIsConnecting(false);
      cleanup();
    }
  }, [initializePeerConnection]);

  // Toggle microphone mute
  const toggleMuteCall = useCallback(() => {
    if (localStreamRef.current) {
      const newMutedState = !isMuted;
      toggleMute(localStreamRef.current, newMutedState);
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  // Cleanup resources
  const cleanup = useCallback(() => {
    stopDurationTimer();
    
    if (localStreamRef.current) {
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      stopMediaStream(remoteStreamRef.current);
      remoteStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }

    if (peerConnectionRef.current) {
      closePeerConnection(peerConnectionRef.current);
      peerConnectionRef.current = null;
    }

    callIdRef.current = null;
    remoteSocketIdRef.current = null;
    pendingIceCandidatesRef.current = [];  // Clear queued ICE candidates
    setConnectionState('new');
    setIsMuted(false);
    setIsConnecting(false);
    setCallDuration(0);
  }, [stopDurationTimer]);

  // End call
  const endCallAction = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Format duration as MM:SS
  const formattedDuration = useCallback(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  return {
    connectionState,
    isMuted,
    isConnecting,
    error,
    callDuration,
    formattedDuration: formattedDuration(),
    startCall,
    answerCall,
    toggleMute: toggleMuteCall,
    endCall: endCallAction,
    cleanup,
  };
};

export default useWebRTC;

