"use client"

import { motion } from "framer-motion"

interface AtriaLogoAnimatedProps {
  size?: number
  className?: string
}

export function AtriaLogoAnimated({ size = 24, className = "" }: AtriaLogoAnimatedProps) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.05, 1],
        rotate: [0, 2, -2, 0],
      }}
      transition={{
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-20 blur-sm"
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Main logo */}
      <div className="relative z-10 font-bold text-slate-800 dark:text-white flex items-center justify-center">
        <motion.span
          className="text-lg font-black"
          style={{ fontSize: size * 0.6 }}
          animate={{
            color: ["#1e293b", "#0ea5e9", "#06b6d4", "#1e293b"],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          A
        </motion.span>
        <motion.div
          className="w-1 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full ml-0.5"
          style={{
            width: size * 0.08,
            height: size * 0.08,
            marginLeft: size * 0.02,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-blue-400/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeOut",
        }}
      />
    </motion.div>
  )
}
