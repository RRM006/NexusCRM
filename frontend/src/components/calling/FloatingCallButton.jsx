import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, X, Headphones, Loader2 } from 'lucide-react';
import { useCall, CALL_STATUS } from '../../context/CallContext';
import { useCompany } from '../../context/CompanyContext';

const FloatingCallButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentRole } = useCompany();
  const {
    callStatus,
    isSocketConnected,
    onlineAdmins,
    callSupport,
    cancelOutgoingCall,
    getOnlineAdminsCount,
  } = useCall();

  // Only show for customers
  if (currentRole !== 'CUSTOMER') {
    return null;
  }

  const isIdle = callStatus === CALL_STATUS.IDLE;
  const isRequesting = callStatus === CALL_STATUS.REQUESTING;
  const isRinging = callStatus === CALL_STATUS.RINGING;
  const isInCall = callStatus === CALL_STATUS.CONNECTING || callStatus === CALL_STATUS.CONNECTED;
  const canCall = isIdle && isSocketConnected;

  const handleToggle = () => {
    if (isIdle) {
      setIsExpanded(!isExpanded);
      if (!isExpanded) {
        getOnlineAdminsCount();
      }
    }
  };

  const handleCall = () => {
    callSupport();
    setIsExpanded(false);
  };

  const handleCancel = () => {
    cancelOutgoingCall();
  };

  // Don't show if in a call (ActiveCallUI handles that)
  if (isInCall) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {/* Expanded panel */}
        {isExpanded && isIdle && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-cyan-600">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Need Support?</h3>
                  <p className="text-emerald-100 text-sm">Call us directly from here</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-400">
                  {isSocketConnected ? 'Connected to support' : 'Connecting...'}
                </span>
              </div>

              {/* Online Agents */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${onlineAdmins.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-sm text-slate-400">
                  {onlineAdmins.length > 0
                    ? `${onlineAdmins.length} agent${onlineAdmins.length > 1 ? 's' : ''} available`
                    : 'No agents online'
                  }
                </span>
              </div>

              {/* Call Button */}
              <motion.button
                whileHover={canCall ? { scale: 1.02 } : {}}
                whileTap={canCall ? { scale: 0.98 } : {}}
                onClick={handleCall}
                disabled={!canCall}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  canCall
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/30'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Phone className="w-5 h-5" />
                {isSocketConnected ? 'Start Voice Call' : 'Connecting...'}
              </motion.button>

              <p className="text-xs text-slate-500 text-center">
                Free browser-based call • No phone needed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      {isIdle && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all ${
            isExpanded
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-emerald-500/40 hover:shadow-xl'
          }`}
        >
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <Phone className="w-7 h-7 text-white" />
              {isSocketConnected && onlineAdmins.length > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full border-2 border-emerald-500"
                />
              )}
            </div>
          )}
        </motion.button>
      )}

      {/* Calling/Ringing State */}
      {(isRequesting || isRinging) && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-white font-semibold">
            {isRequesting ? 'Connecting...' : 'Calling...'}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default FloatingCallButton;

