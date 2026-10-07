import { ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardBody } from '../ui/Card.jsx'

export default function RankUpCard({ from, to }) {
  if (!from || !to) return null
  const ToIcon = to.icon
  const FromIcon = from.icon

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-white shadow-xl shadow-amber-500/30">
        <CardBody className="space-y-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
              <ArrowUpRight size={14} />
              <span className="font-bold text-sm">PROMOTION !</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2 opacity-60">
              <span className="w-14 h-14 rounded-2xl bg-white/20 grid place-items-center ring-2 ring-white/30">
                <FromIcon size={24} />
              </span>
              <span className="text-xs font-bold">{from.name}</span>
            </div>
            
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArrowUpRight size={28} className="text-white" />
            </motion.div>
            
            <div className="flex flex-col items-center gap-2">
              <motion.span
                className="w-18 h-18 rounded-2xl bg-white grid place-items-center ring-4 ring-white/50"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ToIcon size={32} className="text-amber-600" />
              </motion.span>
              <span className="text-lg font-black">{to.name}</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-white/80">
            Nouveau rang atteint ! Continue pour viser plus haut.
          </p>
        </CardBody>
      </Card>
    </motion.div>
  )
}
