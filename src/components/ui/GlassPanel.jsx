import { motion } from 'framer-motion'

export default function GlassPanel({ className = '', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={[
        'rounded-2xl border border-black/10',
        'bg-[#F4EBD0]/75 supports-[backdrop-filter]:bg-[#F4EBD0]/55',
        'backdrop-blur-md shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)]',
        className,
      ].join(' ')}
    >
      {children}
    </motion.div>
  )
}

