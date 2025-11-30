import { motion } from 'framer-motion';
import { Phone, PhoneOff, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useCall, CALL_STATUS } from '../../context/CallContext';

const CallSupportButton = ({ className = '' }) => {
  const {
    callStatus,
    isSocketConnected,
    onlineAdmins,
    callSupport,
    cancelOutgoingCall,
    getOnlineAdminsCount,
  } = useCall();

  // Refresh online admins count
  const handleMouseEnter = () => {
    getOnlineAdminsCount();
  };

  const isIdle = callStatus === CALL_STATUS.IDLE;
  const isRequesting = callStatus === CALL_STATUS.REQUESTING;
  const isRinging = callStatus === CALL_STATUS.RINGING;
  const canCall = isIdle && isSocketConnected;

  return (
    <div className={`${className}`} onMouseEnter={handleMouseEnter}>
      <div className="relative">
        {/* Main button */}
        {(isIdle || !isSocketConnected) && (
          <motion.button
            whileHover={canCall ? { scale: 1.05 } : {}}
            whileTap={canCall ? { scale: 0.95 } : {}}
            onClick={callSupport}
            disabled={!canCall}
            className={`
              relative flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold text-white
              transition-all duration-300 shadow-lg
              ${canCall 
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-emerald-500/40 hover:shadow-xl cursor-pointer' 
                : 'bg-slate-600 cursor-not-allowed opacity-70'
              }
            `}
          >
            <div className="relative">
              {isSocketConnected ? (
                <>
                  <Phone className="w-6 h-6" />
                  <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full"
                  />
                </>
              ) : (
                <WifiOff className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <span className="text-lg">
              {isSocketConnected ? 'Call Support' : 'Connecting...'}
            </span>
          </motion.button>
        )}

        {/* Calling state */}
        {(isRequesting || isRinging) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-white font-semibold text-lg">
              {isRequesting ? 'Requesting...' : 'Calling...'}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={cancelOutgoingCall}
              className="ml-2 p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </motion.button>
          </motion.div>
        )}

        {/* Online admins indicator */}
        {isSocketConnected && isIdle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-center gap-2 text-sm"
          >
            <div className={`w-2 h-2 rounded-full ${onlineAdmins.length > 0 ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            <span className={onlineAdmins.length > 0 ? 'text-emerald-400' : 'text-slate-400'}>
              {onlineAdmins.length > 0 
                ? `${onlineAdmins.length} support agent${onlineAdmins.length > 1 ? 's' : ''} online`
                : 'No agents available'
              }
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CallSupportButton;

