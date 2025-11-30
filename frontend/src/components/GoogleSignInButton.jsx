import { GoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'

const GoogleSignInButton = ({ onSuccess, onError, text = 'signin_with' }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full flex justify-center"
    >
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        text={text}
        shape="rectangular"
        theme="outline"
        size="large"
        width="100%"
        logo_alignment="left"
      />
    </motion.div>
  )
}

export default GoogleSignInButton

