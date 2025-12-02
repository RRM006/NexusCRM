import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, User } from 'lucide-react';
import { useCall, CALL_STATUS } from '../../context/CallContext';

const IncomingCallModal = () => {
  const { callStatus, incomingCall, acceptIncomingCall, rejectIncomingCall } = useCall();

  const isVisible = callStatus === CALL_STATUS.INCOMING && incomingCall;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm mx-4"
          >
            {/* Glowing ring effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 blur-xl opacity-50 animate-pulse" />
            
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
              {/* Caller avatar */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="relative mb-6"
                >
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
                  
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </motion.div>

                {/* Caller info */}
                <h3 className="text-2xl font-bold text-white mb-1">
                  {incomingCall?.callerName || 'Unknown Caller'}
                </h3>
                <p className="text-slate-400 text-sm mb-2">
                  {incomingCall?.isFromAdmin ? 'Support is calling you' : 'Customer Support Call'}
                </p>
                
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-emerald-400 font-medium"
                >
                  Incoming call...
                </motion.p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 mt-8">
                {/* Reject button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={rejectIncomingCall}
                  className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 flex items-center justify-center transition-all hover:shadow-red-500/50"
                >
                  <PhoneOff className="w-7 h-7 text-white transform rotate-135" />
                  <span className="absolute -bottom-8 text-xs text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Decline
                  </span>
                </motion.button>

                {/* Accept button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={acceptIncomingCall}
                  className="group relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:shadow-emerald-500/50"
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Phone className="w-9 h-9 text-white" />
                  </motion.div>
                  <span className="absolute -bottom-8 text-xs text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Accept
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallModal;

