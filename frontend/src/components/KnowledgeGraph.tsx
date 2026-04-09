import { useEffect, useRef, useState } from 'react'

interface GraphNode {
  id: string
  name: string
  type: 'character' | 'location' | 'item' | 'faction' | 'event' | 'concept'
  x?: number
  y?: number
  importance?: 'core' | 'important' | 'normal' | 'minor'
}

interface GraphEdge {
  source: string
  target: string
  relationType: string
  isImplicit?: boolean
  confidence?: number
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  onEdgeClick?: (edge: GraphEdge) => void
  width?: number
  height?: number
}

const typeColors: Record<string, string> = {
  character: '#FF6B6B',
  location: '#4ECDC4',
  item: '#FFE66D',
  faction: '#95E1D3',
  event: '#DDA0DD',
  concept: '#C9B1FF'
}

const relationColors: Record<string, string> = {
  '恋人': '#FF6B6B',
  '夫妻': '#FF6B6B',
  '父子': '#4ECDC4',
  '母子': '#4ECDC4',
  '兄弟': '#4ECDC4',
  '朋友': '#95E1D3',
  '敌对': '#E74C3C',
  '竞争': '#F39C12',
  '所属': '#9B59B6',
  '师徒': '#3498DB',
  '同伴': '#1ABC9C'
}

export default function KnowledgeGraph({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  width = 600,
  height = 400
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    initializePositions()
  }, [nodes])

  const initializePositions = () => {
    if (nodes.length === 0) return

    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 60

    nodes.forEach((node, index) => {
      if (!node.x || !node.y) {
        const angle = (2 * Math.PI * index) / nodes.length
        node.x = centerX + radius * Math.cos(angle)
        node.y = centerY + radius * Math.sin(angle)
      }
    })
  }

  useEffect(() => {
    draw()
  }, [nodes, edges, hoveredNode, selectedNode, transform])

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)

    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      if (!sourceNode?.x || !sourceNode?.y || !targetNode?.x || !targetNode?.y) return

      ctx.beginPath()
      ctx.moveTo(sourceNode.x, sourceNode.y)
      ctx.lineTo(targetNode.x, targetNode.y)

      const edgeColor = relationColors[edge.relationType] || '#95a5a6'
      ctx.strokeStyle = edge.isImplicit ? `${edgeColor}60` : edgeColor
      ctx.lineWidth = edge.isImplicit ? 1 : 2
      ctx.stroke()

      const midX = (sourceNode.x + targetNode.x) / 2
      const midY = (sourceNode.y + targetNode.y) / 2
      ctx.fillStyle = edgeColor
      ctx.font = '10px system-ui'
      ctx.fillText(edge.relationType, midX, midY)
    })

    nodes.forEach(node => {
      if (!node.x || !node.y) return

      const isHovered = hoveredNode === node.id
      const isSelected = selectedNode === node.id
      const color = typeColors[node.type] || '#CCCCCC'

      const baseSize = node.importance === 'core' ? 20 : node.importance === 'important' ? 16 : 12
      const size = isHovered ? baseSize + 4 : isSelected ? baseSize + 2 : baseSize

      ctx.beginPath()
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
      ctx.fillStyle = `${color}30`
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#fff' : color
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = `${size * 0.8}px system-ui`
      ctx.textAlign = 'center'
      ctx.fillText(node.name, node.x, node.y + size + 14)

      ctx.font = '9px system-ui'
      ctx.fillStyle = '#888'
      ctx.fillText(node.type, node.x, node.y - size - 4)
    })

    ctx.restore()
  }

  const getNodeAtPosition = (x: number, y: number): GraphNode | null => {
    const transformedX = (x - transform.x) / transform.scale
    const transformedY = (y - transform.y) / transform.scale

    for (const node of nodes) {
      if (!node.x || !node.y) continue
      const dx = transformedX - node.x
      const dy = transformedY - node.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const size = node.importance === 'core' ? 20 : node.importance === 'important' ? 16 : 12
      if (dist <= size + 5) return node
    }
    return null
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging) {
      setTransform(t => ({
        ...t,
        x: t.x + (e.clientX - rect.left - dragStart.x),
        y: t.y + (e.clientY - rect.top - dragStart.y)
      }))
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      return
    }

    const node = getNodeAtPosition(x, y)
    setHoveredNode(node?.id || null)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const node = getNodeAtPosition(x, y)

    if (node) {
      setSelectedNode(node.id)
      onNodeClick?.(node)
    } else {
      setSelectedNode(null)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => ({
      ...t,
      scale: Math.max(0.3, Math.min(3, t.scale * delta))
    }))
  }

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 })
    initializePositions()
  }

  return (
    <div className="relative bg-dark-200 rounded-lg overflow-hidden">
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          onClick={resetView}
          className="px-2 py-1 bg-dark-300 text-xs text-gray-300 rounded hover:bg-dark-100 transition"
        >
          重置
        </button>
        <button
          onClick={() => setTransform(t => ({ ...t, scale: t.scale * 1.2 }))}
          className="px-2 py-1 bg-dark-300 text-xs text-gray-300 rounded hover:bg-dark-100 transition"
        >
          放大
        </button>
        <button
          onClick={() => setTransform(t => ({ ...t, scale: t.scale * 0.8 }))}
          className="px-2 py-1 bg-dark-300 text-xs text-gray-300 rounded hover:bg-dark-100 transition"
        >
          缩小
        </button>
      </div>

      <div className="absolute top-2 right-2 z-10 text-xs text-gray-500">
        {nodes.length} 节点 / {edges.length} 关系
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`${isDragging ? 'cursor-grabbing' : hoveredNode ? 'cursor-pointer' : 'cursor-grab'}`}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-xs">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 text-gray-400">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{type === 'character' ? '人物' : type === 'location' ? '地点' : type === 'item' ? '物品' : type === 'faction' ? '势力' : type === 'event' ? '事件' : '概念'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}