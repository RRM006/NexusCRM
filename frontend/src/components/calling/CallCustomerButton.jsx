import { motion } from 'framer-motion';
import { Phone, Loader2 } from 'lucide-react';
import { useCall, CALL_STATUS } from '../../context/CallContext';
import { useCompany } from '../../context/CompanyContext';

/**
 * Button for admin/staff to initiate a call to a customer
 * Note: The customer must be ONLINE for the call to work.
 */
const CallCustomerButton = ({ 
  customerId, 
  customerName,
  className = '',
  size = 'sm' // 'sm' | 'md' | 'lg'
}) => {
  const { currentRole } = useCompany();
  const { callStatus, isSocketConnected, callCustomer } = useCall();

  // Only show for admin/staff
  if (currentRole !== 'ADMIN' && currentRole !== 'STAFF') {
    return null;
  }

  const isIdle = callStatus === CALL_STATUS.IDLE;
  const canCall = isIdle && isSocketConnected;

  const handleCall = () => {
    if (canCall && customerId) {
      callCustomer(customerId, customerName);
    }
  };

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      whileHover={canCall ? { scale: 1.1 } : {}}
      whileTap={canCall ? { scale: 0.95 } : {}}
      onClick={handleCall}
      disabled={!canCall}
      title={canCall ? `Call ${customerName || 'customer'}` : 'Cannot call right now'}
      className={`
        ${sizeClasses[size]} rounded-lg transition-all
        ${canCall 
          ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 hover:text-emerald-600' 
          : 'text-dark-400 cursor-not-allowed opacity-50'
        }
        ${className}
      `}
    >
      {!isSocketConnected ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Phone className={iconSizes[size]} />
      )}
    </motion.button>
  );
};

export default CallCustomerButton;

