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

// Audio constraints for voice-only calls (strict)
export const AUDIO_CONSTRAINTS_STRICT = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
  },
  video: false,
};

// Basic audio constraints (fallback)
export const AUDIO_CONSTRAINTS_BASIC = {
  audio: true,
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
 * Enumerate available audio input devices
 * @returns {Promise<MediaDeviceInfo[]>}
 */
export const getAudioDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Error enumerating devices:', error);
    return [];
  }
};

/**
 * Gets the user's audio stream with progressive fallback
 * First tries strict constraints, then basic, then specific device
 * @returns {Promise<MediaStream>}
 */
export const getLocalAudioStream = async () => {
  // First, check if getUserMedia is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('❌ getUserMedia not supported in this browser');
    throw new Error('Your browser does not support audio calls. Please use a modern browser.');
  }

  // Try 1: Strict constraints (best quality)
  try {
    console.log('🎤 Trying strict audio constraints...');
    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS_STRICT);
    console.log('✅ Got audio stream with strict constraints');
    return stream;
  } catch (error) {
    console.warn('⚠️ Strict constraints failed:', error.name, error.message);
  }

  // Try 2: Basic constraints (just audio: true)
  try {
    console.log('🎤 Trying basic audio constraints...');
    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS_BASIC);
    console.log('✅ Got audio stream with basic constraints');
    return stream;
  } catch (error) {
    console.warn('⚠️ Basic constraints failed:', error.name, error.message);
  }

  // Try 3: Find specific device and try with deviceId
  try {
    console.log('🎤 Enumerating audio devices...');
    const audioDevices = await getAudioDevices();
    console.log('📋 Available audio devices:', audioDevices.length);
    
    if (audioDevices.length > 0) {
      for (const device of audioDevices) {
        console.log(`🎤 Trying device: ${device.label || device.deviceId}`);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: device.deviceId } },
            video: false
          });
          console.log('✅ Got audio stream with specific device');
          return stream;
        } catch (e) {
          console.warn(`⚠️ Device ${device.deviceId} failed:`, e.message);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Device enumeration failed:', error.message);
  }

  // All attempts failed
  console.error('❌ All audio access attempts failed');
  throw new Error('Could not access microphone. Please check that a microphone is connected and permissions are granted.');
};

/**
 * Adds local audio stream tracks to peer connection
 * @param {RTCPeerConnection} peerConnection 
 * @param {MediaStream} localStream 
 */
export const addLocalStreamToPeerConnection = (peerConnection, localStream) => {
  const tracks = localStream.getTracks();
  console.log(`📤 Adding ${tracks.length} local track(s) to peer connection`);
  
  tracks.forEach(track => {
    console.log(`  ➕ Track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
    const sender = peerConnection.addTrack(track, localStream);
    console.log(`  ✅ Sender created:`, sender);
  });
  
  // Log current senders
  const senders = peerConnection.getSenders();
  console.log(`📊 Total senders on peer connection: ${senders.length}`);
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
  console.log('📥 Setting remote description (offer)...');
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  console.log('✅ Remote description set');
  
  // Check senders before creating answer
  const senders = peerConnection.getSenders();
  console.log(`📊 Senders before answer: ${senders.length}`);
  senders.forEach((sender, i) => {
    console.log(`  Sender ${i}: track=${sender.track?.kind || 'none'}, enabled=${sender.track?.enabled}`);
  });
  
  console.log('📝 Creating answer...');
  const answer = await peerConnection.createAnswer();
  console.log('✅ Answer created');
  
  // Log SDP to check if audio is included
  if (answer.sdp) {
    const hasAudio = answer.sdp.includes('m=audio');
    console.log(`🎵 Answer SDP has audio: ${hasAudio}`);
  }
  
  await peerConnection.setLocalDescription(answer);
  console.log('✅ Local description set');
  
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
 * Plays audio from a remote stream using DOM audio element
 * @param {MediaStream} remoteStream 
 * @returns {HTMLAudioElement|null}
 */
export const playRemoteAudio = (remoteStream) => {
  console.log('🔊 ========== SETTING UP REMOTE AUDIO ==========');
  console.log('Remote stream:', remoteStream);
  console.log('Remote stream active:', remoteStream.active);
  console.log('Remote stream tracks:', remoteStream.getTracks().length);
  
  remoteStream.getTracks().forEach((track, i) => {
    console.log(`  Track ${i}: kind=${track.kind}, enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
  });

  // Try to use DOM audio element first (preferred for autoplay)
  const remoteAudio = window.__webrtc_remote_audio || document.getElementById('remote-audio');

  if (remoteAudio) {
    console.log('✅ Using DOM audio element for remote stream');
    console.log('  Audio element muted:', remoteAudio.muted);
    console.log('  Audio element volume:', remoteAudio.volume);
    
    remoteAudio.srcObject = remoteStream;
    
    // Make sure it's not muted and volume is up
    remoteAudio.muted = false;
    remoteAudio.volume = 1.0;

    // Ensure autoplay
    const playPromise = remoteAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Remote audio playing successfully!');
          console.log('  Current time:', remoteAudio.currentTime);
          console.log('  Paused:', remoteAudio.paused);
        })
        .catch(e => {
          console.warn('⚠️ Autoplay blocked. Error:', e.name, e.message);
          console.warn('💡 TIP: Click anywhere on the page to enable audio');
          
          // Try to play on user interaction
          const playOnClick = () => {
            remoteAudio.play()
              .then(() => {
                console.log('✅ Audio started after user interaction');
                document.removeEventListener('click', playOnClick);
              })
              .catch(err => console.error('Still cannot play:', err));
          };
          document.addEventListener('click', playOnClick, { once: true });
        });
    }

    console.log('🔊 =============================================');
    return remoteAudio;
  } else {
    // Fallback to creating audio element
    console.warn('⚠️ DOM audio element not found, creating fallback');
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.autoplay = true;
    audio.playsInline = true;
    audio.muted = false;
    audio.volume = 1.0;
    
    audio.play().catch(e => {
      console.error('❌ Audio play error:', e);
    });
    
    // Append to body so it persists
    document.body.appendChild(audio);
    
    console.log('🔊 =============================================');
    return audio;
  }
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

