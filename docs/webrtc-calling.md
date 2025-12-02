# WebRTC Voice Calling - NexusCRM

## Overview

NexusCRM includes a **peer-to-peer audio calling feature** that allows customers to call company staff (admins/staff) directly from their browser. This uses **pure WebRTC** with a self-hosted WebSocket signaling server — no third-party calling services (Agora, Twilio, etc.) required.

## Technology Stack

- **WebRTC**: Browser-native peer-to-peer audio streaming
- **WebSocket (Socket.io)**: Real-time signaling for offer/answer/ICE exchange
- **STUN Servers**: Google's free STUN servers for NAT traversal
- **PostgreSQL**: Call log storage via Prisma

## Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│    Customer     │                    │   Admin/Staff   │
│    Browser      │                    │    Browser      │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  1. call-request                     │
         ├──────────────────────────────────────┤
         │                                      │
         │  2. incoming-call (to all admins)    │
         │◄─────────────────────────────────────┤
         │                                      │
         │  3. call-accept                      │
         ├──────────────────────────────────────┤
         │                                      │
         │  4. call-accepted (with adminSocketId)
         │◄─────────────────────────────────────┤
         │                                      │
         │  5. WebRTC Offer                     │
         │◄─────────────────────────────────────┤
         │                                      │
         │  6. WebRTC Answer                    │
         ├──────────────────────────────────────►
         │                                      │
         │  7. ICE Candidates (bidirectional)   │
         │◄────────────────────────────────────►│
         │                                      │
         │  8. P2P Audio Stream Established     │
         │◄════════════════════════════════════►│
         │                                      │
         ▼                                      ▼
    ┌────────────────────────────────────────────┐
    │         Socket.io Signaling Server         │
    │         (WebSocket on port 5000)           │
    └────────────────────────────────────────────┘
```

## User Flow

### Customer → Staff Call

1. **Customer Dashboard**: Customer clicks "Call Support" button
2. **Request Sent**: Socket emits `call-request` to signaling server
3. **Admins Notified**: All online admins/staff in the company see "Incoming Call" modal
4. **Accept Call**: Admin clicks "Accept" → connection is initiated
5. **WebRTC Handshake**:
   - Admin creates SDP offer and sends via socket
   - Customer receives offer, creates answer, sends back
   - ICE candidates exchanged bidirectionally
6. **Audio Connected**: Peer-to-peer audio stream established
7. **End Call**: Either party can hang up → call log saved to database

### Staff → Customer Call

Admin/Staff can initiate calls to customers from:
- **Customers list page** (📞 phone icon on each customer row)
- Customer must be **online** (logged in and connected to socket)

**Flow:**
1. **Admin clicks call button** on customer card
2. **Socket emits `call-customer`** with customerId
3. **Server checks** if customer is online
4. **Customer receives** "Incoming Call" modal (shows "Support is calling you")
5. **Customer accepts** → connection is initiated
6. **WebRTC Handshake** (same as above)
7. **Call log saved** with both parties recorded

## Data Saved (CallLog Model)

Each call creates a `CallLog` entry in the database:

| Field | Description |
|-------|-------------|
| `id` | Unique UUID |
| `companyId` | Tenant isolation |
| `callerId` | User who initiated the call |
| `calleeId` | User who received/answered |
| `startTime` | When call was initiated |
| `answerTime` | When call was answered |
| `endTime` | When call ended |
| `durationSec` | Actual talk time in seconds |
| `status` | INITIATED, RINGING, CONNECTED, COMPLETED, MISSED, FAILED, CANCELLED |
| `callType` | AUDIO (default) or VIDEO |
| `sessionId` | WebSocket session ID for debugging |
| `notes` | Optional notes about the call |

## Limitations

### No Built-in Recording
WebRTC audio **cannot be reliably recorded in-browser** without complex MediaRecorder setup and significant user permissions. For MVP, we **only log metadata** (duration, participants, status).

> **Future Enhancement**: Server-side recording would require a media server (e.g., Kurento, Jitsi) which adds significant infrastructure complexity.

### Network Restrictions
WebRTC may fail (~5-10% of calls) in restrictive network environments:
- Strict corporate firewalls
- Symmetric NATs
- VPNs that block UDP traffic

**Solution**: Add a TURN server (see below) for production deployments.

### Browser Compatibility
Requires modern browsers with WebRTC support:
- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

## Configuration

### Frontend Environment Variables

```env
# .env (frontend)
VITE_API_URL=http://localhost:5000/api
```

### Backend Environment Variables

```env
# .env (backend)
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### STUN Servers (Built-in)

The following free Google STUN servers are configured:

```javascript
// frontend/src/lib/webrtc.js
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
```

### Adding TURN Server (Optional but Recommended for Production)

If calls fail behind strict firewalls, add a TURN server:

1. **Deploy coturn** (open-source TURN server):
   ```bash
   # Ubuntu/Debian
   apt install coturn
   
   # Configure /etc/turnserver.conf
   listening-port=3478
   realm=your-domain.com
   server-name=your-domain.com
   user=username:password
   ```

2. **Update ICE configuration** in `frontend/src/lib/webrtc.js`:
   ```javascript
   export const ICE_SERVERS = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       {
         urls: 'turn:your-turn-server.com:3478',
         username: 'username',
         credential: 'password'
       }
     ],
   };
   ```

## API Endpoints

### Call Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/calls/start` | Create new call log entry |
| `PUT` | `/api/calls/:id/status` | Update call status |
| `PUT` | `/api/calls/:id/end` | End call and save duration |
| `POST` | `/api/calls/session` | Find/create by session ID |

### Call History

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calls/history` | Get paginated call history |
| `GET` | `/api/calls/stats` | Get call statistics |
| `GET` | `/api/calls/:id` | Get single call details |

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `register` | `{ userId, userName, role, companyId }` | Register user with socket |
| `call-request` | `{ companyId }` | Customer initiates call to support |
| `call-customer` | `{ customerId, companyId }` | Admin initiates call to customer |
| `call-accept` | `{ callId }` | Admin accepts call from customer |
| `customer-accept-call` | `{ callId }` | Customer accepts call from admin |
| `call-reject` | `{ callId }` | Reject incoming call |
| `call-cancel` | `{ callId }` | Cancel outgoing call |
| `call-end` | `{ callId }` | Either party ends active call |
| `webrtc-offer` | `{ callId, offer, to }` | Send SDP offer |
| `webrtc-answer` | `{ callId, answer, to }` | Send SDP answer |
| `webrtc-ice-candidate` | `{ callId, candidate, to }` | Send ICE candidate |
| `get-online-admins` | `{ companyId }` | Get list of online admins |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `call-ringing` | `{ callId }` | Caller: call is ringing |
| `incoming-call` | `{ callId, callerId, callerName, companyId, isFromAdmin }` | Incoming call notification |
| `call-accepted` | `{ callId, ...participantInfo }` | Call was accepted |
| `call-connected` | `{ callId, callerId, callerName, callerSocketId }` | Ready to start WebRTC |
| `call-taken` | `{ callId, adminName }` | Other admins: call taken |
| `call-cancelled` | `{ callId }` | Call was cancelled |
| `call-ended` | `{ callId, reason, duration }` | Call ended |
| `call-error` | `{ message }` | Error occurred |
| `online-admins` | `{ admins[] }` | List of online admins/staff |
| `user-online` | `{ userId, userName, role }` | User came online |
| `user-offline` | `{ userId }` | User went offline |

## Troubleshooting

### "No sound" or "One-way audio"

1. **Check microphone permissions**: Click the 🔒 icon in the browser address bar → Allow microphone
2. **Check audio output**: Ensure correct speakers/headphones are selected
3. **Verify browser console**: Look for `getUserMedia` errors
4. **Try different browser**: Test Chrome vs Firefox

### "Call not connecting"

1. **Check WebSocket connection**: Look for "Socket connected" in console
2. **Verify both users are online**: Check "online admins" count
3. **Test on different networks**: Same network often works; different networks may need TURN
4. **Check firewall**: Ensure ports 80/443 are open

### "ICE connection failed"

This usually means NAT traversal failed:

1. **Add more STUN servers** (already configured)
2. **Deploy a TURN server** (recommended for production)
3. **Check corporate firewall** settings
4. **Try switching to cellular data** (to rule out network issues)

### Debugging in Browser Console

Enable verbose logging:

```javascript
// In browser console
localStorage.setItem('debug', 'socket.io-client:*');
```

Check ICE candidate gathering:

```javascript
// Look for these in console
// Good: "ICE candidate gathered: host", "ICE candidate gathered: srflx"
// Bad: Only "host" candidates (STUN not working)
// Very bad: No candidates at all
```

## Security Considerations

1. **Authentication Required**: All socket events require valid JWT token
2. **Company Isolation**: Users can only call within their company
3. **Role Enforcement**: Only ADMIN/STAFF can accept calls
4. **Private Rooms**: WebSocket rooms are company-specific

## Future Enhancements

- [ ] Video calling support
- [ ] Call hold/transfer
- [ ] Voicemail (requires server-side recording)
- [ ] Call scheduling
- [ ] Conference calls
- [ ] Screen sharing
- [ ] Mobile app integration (React Native)

## Manual Testing Checklist

After deploying, test the following:

1. ✅ Customer can see "Call Support" button
2. ✅ Customer can initiate a call
3. ✅ Admins see incoming call notification
4. ✅ Admin can accept the call
5. ✅ WebRTC handshake completes (check console)
6. ✅ Audio flows in **both directions**
7. ✅ Mute button works
8. ✅ Call duration displays correctly
9. ✅ Hang up works from both ends
10. ✅ Call log is saved to database
11. ✅ Call history shows in API
12. ✅ Test on different networks (WiFi → cellular)
13. ✅ Test in different browsers

## Support

For issues with WebRTC calling:
1. Check browser console for errors
2. Review WebSocket connection status
3. Verify ICE candidate exchange
4. Test with verbose logging enabled

