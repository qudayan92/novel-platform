import { useState } from 'react'

interface OutlineNode {
  id: string
  type: 'arc' | 'section' | 'chapter'
  title: string
  description?: string
  orderIndex: number
  children?: OutlineNode[]
  wordCountTarget?: number
  status?: 'planning' | 'writing' | 'completed'
}

interface Props {
  novelId: string
  outline: {
    level: 'three' | 'two' | 'one'
    structure: OutlineNode[]
  } | null
  onGenerateOutline: () => void
  onUpdateNode: (nodeId: string, updates: Partial<OutlineNode>) => void
  onDeleteNode: (nodeId: string) => void
  onAddNode: (parentId: string | null, type: OutlineNode['type'], title: string) => void
  onMoveNode: (nodeId: string, newParentId: string | null, newIndex: number) => void
}

export default function OutlineManager({
  outline,
  onGenerateOutline,
  onUpdateNode,
  onDeleteNode,
  onAddNode
}: Props) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [addingTo, setAddingTo] = useState<{ parentId: string | null; type: OutlineNode['type'] } | null>(null)

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleAddNode = () => {
    if (addingTo && newNodeTitle.trim()) {
      onAddNode(addingTo.parentId, addingTo.type, newNodeTitle.trim())
      setNewNodeTitle('')
      setAddingTo(null)
    }
  }

  const typeLabels: Record<string, string> = {
    arc: '卷',
    section: '节',
    chapter: '章'
  }

  const typeColors: Record<string, string> = {
    arc: 'border-l-blue-500',
    section: 'border-l-green-500',
    chapter: 'border-l-yellow-500'
  }

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500/20 text-blue-400',
    writing: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400'
  }

  const renderNode = (node: OutlineNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isEditing = editingNode === node.id

    return (
      <div key={node.id} className="mb-1">
        <div
          className={`flex items-center gap-2 p-2 bg-dark-300 rounded hover:bg-dark-100 transition border-l-4 ${
            typeColors[node.type]
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="text-gray-400 hover:text-white transition"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}

          {isEditing ? (
            <input
              type="text"
              defaultValue={node.title}
              className="flex-1 px-2 py-1 bg-dark-100 border border-dark-50 rounded text-sm focus:outline-none"
              autoFocus
              onBlur={e => {
                onUpdateNode(node.id, { title: e.target.value })
                setEditingNode(null)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onUpdateNode(node.id, { title: (e.target as HTMLInputElement).value })
                  setEditingNode(null)
                }
              }}
            />
          ) : (
            <span
              className="flex-1 cursor-pointer"
              onClick={() => setEditingNode(node.id)}
            >
              {node.title}
            </span>
          )}

          <span className={`text-xs px-2 py-0.5 rounded ${statusColors[node.status || 'planning']}`}>
            {node.status === 'planning' ? '规划' : node.status === 'writing' ? '写作中' : '完成'}
          </span>

          {node.wordCountTarget && (
            <span className="text-xs text-gray-500">{node.wordCountTarget}字</span>
          )}

          <button
            onClick={() => setAddingTo({ parentId: node.id, type: node.type === 'chapter' ? 'chapter' : 'section' })}
            className="text-gray-500 hover:text-primary-400 transition text-sm"
          >
            +
          </button>

          <button
            onClick={() => onDeleteNode(node.id)}
            className="text-gray-500 hover:text-red-400 transition text-sm"
          >
            ×
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.sort((a, b) => a.orderIndex - b.orderIndex).map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-dark-200 rounded-lg flex flex-col h-full">
      <div className="p-4 border-b border-dark-100 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <span>📋</span>
          <span>大纲管理</span>
        </h3>
        <div className="flex gap-2">
          {!outline && (
            <button
              onClick={onGenerateOutline}
              className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition"
            >
              生成大纲
            </button>
          )}
          <span className="text-xs text-gray-500">
            {outline?.level === 'three' ? '三级大纲' : outline?.level === 'two' ? '二级大纲' : '一级大纲'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {outline ? (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                value={newNodeTitle}
                onChange={e => setNewNodeTitle(e.target.value)}
                placeholder="输入新卷/节/章名称"
                className="flex-1 px-3 py-2 bg-dark-300 border border-dark-100 rounded text-sm focus:outline-none focus:border-primary-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddNode()
                }}
              />
              <button
                onClick={() => setAddingTo({ parentId: null, type: 'arc' })}
                className="px-3 py-2 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition"
              >
                添加卷
              </button>
            </div>

            {outline.structure.sort((a, b) => a.orderIndex - b.orderIndex).map(node => renderNode(node, 0))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <div className="text-center">
              <div className="mb-2">暂无大纲</div>
              <button
                onClick={onGenerateOutline}
                className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition"
              >
                一键生成三级大纲
              </button>
            </div>
          </div>
        )}
      </div>

      {addingTo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-200 p-4 rounded-lg w-80">
            <h4 className="font-bold mb-3">添加{typeLabels[addingTo.type]}</h4>
            <input
              type="text"
              value={newNodeTitle}
              onChange={e => setNewNodeTitle(e.target.value)}
              placeholder={`${typeLabels[addingTo.type]}名称`}
              className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded mb-3 focus:outline-none focus:border-primary-500"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddNode()
                if (e.key === 'Escape') setAddingTo(null)
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAddingTo(null)}
                className="px-3 py-1 bg-dark-300 text-gray-400 rounded text-sm hover:bg-dark-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleAddNode}
                className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}