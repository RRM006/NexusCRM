import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, User, Loader2, Signal } from 'lucide-react';
import { useCall, CALL_STATUS } from '../../context/CallContext';

const ActiveCallUI = () => {
  const {
    callStatus,
    callInfo,
    connectionState,
    isMuted,
    callDuration,
    endActiveCall,
    toggleMute,
  } = useCall();

  const isActive = 
    callStatus === CALL_STATUS.CONNECTING || 
    callStatus === CALL_STATUS.CONNECTED;

  if (!isActive) return null;

  const isConnecting = callStatus === CALL_STATUS.CONNECTING || connectionState === 'connecting';
  const isConnected = connectionState === 'connected';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-3xl blur-xl opacity-40 ${
            isConnected ? 'bg-emerald-500' : 'bg-amber-500'
          }`} />

          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700/50 min-w-[320px]">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <motion.div
                  animate={isConnected ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isConnected 
                      ? 'bg-gradient-to-br from-emerald-400 to-cyan-500' 
                      : 'bg-gradient-to-br from-amber-400 to-orange-500'
                  }`}
                >
                  <User className="w-7 h-7 text-white" />
                </motion.div>
                
                {/* Connection indicator */}
                <motion.div
                  animate={isConnected ? {} : { scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                >
                  {isConnecting ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Signal className="w-3 h-3 text-white" />
                  )}
                </motion.div>
              </div>

              {/* Call info */}
              <div className="flex-1">
                <h4 className="text-white font-semibold text-lg">
                  {callInfo?.adminName || callInfo?.callerName || 'Support Call'}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isConnecting ? 'Connecting...' : 'Connected'}
                  </span>
                  {isConnected && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-mono text-sm">{callDuration}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {/* Mute button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>

                {/* End call button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={endActiveCall}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Audio visualizer (decorative) */}
            {isConnected && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [4, Math.random() * 20 + 4, 4],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: 'easeInOut',
                      }}
                      className="w-1 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full"
                      style={{ minHeight: 4 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActiveCallUI;

