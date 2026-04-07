interface FeaturesGridProps {
  items: Array<{ icon: string; title: string; desc: string }>
}

export default function FeaturesGrid({ items }: FeaturesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 hover:border-violet-500/30 transition-colors"
        >
          <div className="text-4xl mb-4">{item.icon}</div>
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </div>
      ))}
    </div>
  )
}
