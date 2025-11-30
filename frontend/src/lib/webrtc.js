/**
 * WebRTC Configuration and Utility Functions
 * Handles peer-to-peer audio connections
 */

// ICE servers configuration (using free STUN servers)
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
  ],
  iceCandidatePoolSize: 10,
};

// Audio constraints for voice-only calls
export const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
  },
  video: false,
};

/**
 * Creates a new RTCPeerConnection with configured ICE servers
 * @returns {RTCPeerConnection}
 */
export const createPeerConnection = () => {
  const peerConnection = new RTCPeerConnection(ICE_SERVERS);
  return peerConnection;
};

/**
 * Gets the user's audio stream
 * @returns {Promise<MediaStream>}
 */
export const getLocalAudioStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
    return stream;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Could not access microphone. Please check permissions.');
  }
};

/**
 * Adds local audio stream tracks to peer connection
 * @param {RTCPeerConnection} peerConnection 
 * @param {MediaStream} localStream 
 */
export const addLocalStreamToPeerConnection = (peerConnection, localStream) => {
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
};

/**
 * Creates an SDP offer
 * @param {RTCPeerConnection} peerConnection 
 * @returns {Promise<RTCSessionDescriptionInit>}
 */
export const createOffer = async (peerConnection) => {
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: false,
  });
  await peerConnection.setLocalDescription(offer);
  return offer;
};

/**
 * Creates an SDP answer
 * @param {RTCPeerConnection} peerConnection 
 * @param {RTCSessionDescriptionInit} offer 
 * @returns {Promise<RTCSessionDescriptionInit>}
 */
export const createAnswer = async (peerConnection, offer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

/**
 * Sets remote description on peer connection
 * @param {RTCPeerConnection} peerConnection 
 * @param {RTCSessionDescriptionInit} answer 
 */
export const setRemoteAnswer = async (peerConnection, answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

/**
 * Adds an ICE candidate to peer connection
 * @param {RTCPeerConnection} peerConnection 
 * @param {RTCIceCandidateInit} candidate 
 */
export const addIceCandidate = async (peerConnection, candidate) => {
  try {
    if (peerConnection.remoteDescription) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
};

/**
 * Stops all tracks in a media stream
 * @param {MediaStream} stream 
 */
export const stopMediaStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};

/**
 * Closes and cleans up a peer connection
 * @param {RTCPeerConnection} peerConnection 
 */
export const closePeerConnection = (peerConnection) => {
  if (peerConnection) {
    peerConnection.close();
  }
};

/**
 * Plays audio from a remote stream
 * @param {MediaStream} remoteStream 
 * @returns {HTMLAudioElement}
 */
export const playRemoteAudio = (remoteStream) => {
  const audio = new Audio();
  audio.srcObject = remoteStream;
  audio.autoplay = true;
  audio.play().catch(e => console.error('Audio play error:', e));
  return audio;
};

/**
 * Toggles mute on local audio stream
 * @param {MediaStream} localStream 
 * @param {boolean} muted 
 */
export const toggleMute = (localStream, muted) => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }
};

/**
 * Gets connection state as human-readable string
 * @param {RTCPeerConnectionState} state 
 * @returns {string}
 */
export const getConnectionStateMessage = (state) => {
  const states = {
    'new': 'Initializing...',
    'connecting': 'Connecting...',
    'connected': 'Connected',
    'disconnected': 'Disconnected',
    'failed': 'Connection failed',
    'closed': 'Call ended',
  };
  return states[state] || 'Unknown';
};

