interface StatCardProps {
  label: string
  value: string
  color: string
  icon: string
}

export default function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
