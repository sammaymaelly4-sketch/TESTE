'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 bg-[#0D2240] flex flex-col items-center justify-center z-50"
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.4 }}
    >
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-[#E6A817] opacity-30"
          style={{ width: 80 + i * 80, height: 80 + i * 80 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="text-center z-10"
      >
        <div className="text-6xl mb-4">🍺</div>
        <h1 className="text-3xl font-display font-bold text-white">Bar da Carmen</h1>
        <p className="text-[#E6A817] mt-2 text-sm">A cerveja mais gelada da Vila</p>
      </motion.div>
    </motion.div>
  )
}
