"use client"

type Props = {
  className?: string
  strokeWidth?: number
}

export default function HouseLoader({
  className = "w-20 h-20 text-neutral-800 dark:text-neutral-200",
  strokeWidth = 2,
}: Props) {
  return (
    <div className={`inline-block ${className} house-fx`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        {/* Telhado */}
        <path pathLength={100} className="house-line" d="M20 55 L50 30 L80 55" />
        {/* Corpo da casa */}
        <path pathLength={100} className="house-line delay-1" d="M28 55 V80 H72 V55" />
        {/* Porta */}
        <path pathLength={100} className="house-line delay-2" d="M45 80 V65 H55 V80" />
        {/* Janela */}
        <path pathLength={100} className="house-line delay-3" d="M60 65 H68 V58 H60 V65" />
      </svg>

      {/* CSS do efeito de "desenhar" as linhas + um leve float */}
      <style jsx global>{`
        .house-line {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: house-dash 1.2s ease forwards;
        }
        .house-line.delay-1 { animation-delay: .1s; }
        .house-line.delay-2 { animation-delay: .2s; }
        .house-line.delay-3 { animation-delay: .3s; }

        @keyframes house-dash {
          to { stroke-dashoffset: 0; }
        }

        .house-fx {
          animation: house-float 3s ease-in-out infinite;
        }
        @keyframes house-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  )
}
