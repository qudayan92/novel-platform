import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { AIService } from '../services/aiService'
import { useStore } from '../stores/store'
import { useLocation } from 'react-router-dom'
import clsx from 'clsx'

const aiService = new AIService()

interface OutlineNode {
  id: string
  title: string
  children: OutlineNode[]
}

const toolbarButtons = [
  { action: 'toggleBold', icon: 'B', label: '加粗', className: 'font-bold' },
  { action: 'toggleItalic', icon: 'I', label: '斜体', className: 'italic' },
  { action: 'toggleUnderline', icon: 'U', label: '下划线', className: 'underline' },
  { type: 'divider' },
  { action: 'undo', icon: '↶', label: '撤销' },
  { action: 'redo', icon: '↷', label: '重做' },
  { action: 'toggleHeading', params: { level: 2 }, icon: 'H2', label: '二级标题' },
  { action: 'toggleHeading', params: { level: 3 }, icon: 'H3', label: '三级标题' },
  { type: 'divider' },
  { action: 'toggleBlockquote', icon: '❝', label: '引用' },
  { action: 'toggleCodeBlock', icon: '</>', label: '代码块' },
  { type: 'divider' },
  { action: 'toggleBulletList', icon: '•', label: '无序列表' },
  { action: 'toggleOrderedList', icon: '1.', label: '有序列表' },
]

export default function EditorPage() {
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const novelId = query.get('id')
  const [novelMeta, setNovelMeta] = useState({ title: '', synopsis: '' })
  const [activeTab, setActiveTab] = useState<'editor' | 'outline' | 'wiki'>('editor')
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [outline, setOutline] = useState<OutlineNode[]>([
    {
      id: '1',
      title: '第一章 觉醒',
      children: [
        { id: '1-1', title: '1.1 神秘的古币', children: [] },
        { id: '1-2', title: '1.2 青云镇', children: [] }
      ]
    },
    {
      id: '2',
      title: '第二章 幽冥',
      children: [
        { id: '2-1', title: '2.1 门开了', children: [] }
      ]
    }
  ])
  const { updateWordCount } = useStore()

  // Patch 2: outline editing helpers (初步实现)
  const addVolume = () => {
    const v: OutlineNode = { id: `vol-${Date.now()}`, title: '新卷', children: [] }
    setOutline([...outline, v])
  }

  const addChapterToVolume = (volumeId: string) => {
    setOutline(outline.map(v => {
      if (v.id === volumeId) {
        const c: OutlineNode = { id: Date.now().toString(), title: '新章节', children: [] }
        return { ...v, children: [...v.children, c] }
      }
      return v
    }))
  }

  const saveOutlineToServer = async () => {
    if (!novelId) return
    try {
      const res = await fetch(`/api/novels/${novelId}/outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure: outline })
      })
      if (!res.ok) {
        console.error('Save outline failed')
      }
    } catch (e) {
      console.error('Save outline failed', e)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: '开始你的创作...'
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content: `
      <h2>第一章 觉醒</h2>
      <p>窗外的雨势愈发猛烈，狂风卷着水汽拍打在斑驳的玻璃上。</p>
      <p>林墨坐在灯下，手中紧握着那枚泛黄的古币。烛火摇曳，在墙壁上投下诡异的影子。</p>
      <p>"你终究还是找到了这里。"他低声自语道。</p>
    `,
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      setWordCount(text.replace(/\s/g, '').length)
    }
  })

  const handleAIWrite = useCallback(async () => {
    if (!editor || isGenerating) return
    setIsGenerating(true)
    setStatus('正在思考...')

    const content = editor.getText()
    const lastParagraph = content.slice(-500)

    try {
      await aiService.streamWrite(lastParagraph, (text) => {
        const { from } = editor.state.selection
        editor.chain().focus().insertContentAt(from, text).run()
        setStatus('正在生成...')
      })
      setStatus('生成完成')
      updateWordCount(200)
    } catch (error) {
      setStatus('生成失败')
    } finally {
      setIsGenerating(false)
      setTimeout(() => setStatus(''), 2000)
    }
  }, [editor, isGenerating])

  // Load novel meta when an id is present in URL
  useEffect(() => {
    if (!novelId || !editor) return
    fetch(`/api/novels/${novelId}`)
      .then(res => res.json())
      .then((data) => {
        if (data && data.data) {
          const meta = { title: data.data.title || '', synopsis: data.data.synopsis || '' }
          setNovelMeta(meta)
          // Update editor content with basic meta as starter (can be enhanced to load real content)
          const content = `<h2>${meta.title}</h2><p>${meta.synopsis}</p>`
          try { editor.commands.setContent(content) } catch { /* ignore */ }
        }
      })
  }, [novelId, editor])

  const handleSave = async () => {
    if (!novelId) return
    try {
      await fetch(`/api/novels/${novelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: novelMeta.title, synopsis: novelMeta.synopsis })
      })
    } catch { /* ignore */ }
  }

  const handleGenerateOutline = useCallback(async () => {
    setStatus('生成大纲中...')
    try {
      const result = await aiService.generateOutline(
        '主角获得神秘古币，开启一段奇幻旅程',
        '玄幻'
      )
      console.log('生成的大纲:', result)
      setStatus('大纲生成完成')
    } catch (error) {
      setStatus('大纲生成失败')
    }
  }, [])

  const addOutlineNode = (parentId?: string) => {
    const newNode: OutlineNode = {
      id: Date.now().toString(),
      title: '新章节',
      children: []
    }
    if (!parentId) {
      // 追加为新卷，先创建卷再放入新章节
      const newVolume: OutlineNode = { id: `vol-${Date.now()}`, title: '新卷', children: [newNode] }
      setOutline([...outline, newVolume])
    } else {
      setOutline(outline.map(v => v.id === parentId ? { ...v, children: [...v.children, newNode] } : v))
    }
  }

  const executeToolbarAction = (button: typeof toolbarButtons[0]) => {
    if (!editor || !('action' in button)) return
    
    const { action, params } = button
    if (action === 'toggleHeading' && params) {
      editor.chain().focus().toggleHeading({ level: params.level as any }).run()
    } else if (action === 'toggleBold') {
      editor.chain().focus().toggleBold().run()
    } else if (action === 'toggleItalic') {
      editor.chain().focus().toggleItalic().run()
    } else if (action === 'toggleUnderline') {
      editor.chain().focus().toggleUnderline().run()
    } else if (action === 'toggleBlockquote') {
      editor.chain().focus().toggleBlockquote().run()
    } else if (action === 'toggleCodeBlock') {
      editor.chain().focus().toggleCodeBlock().run()
    } else if (action === 'toggleBulletList') {
      editor.chain().focus().toggleBulletList().run()
    } else if (action === 'toggleOrderedList') {
      editor.chain().focus().toggleOrderedList().run()
    } else if (action === 'undo') {
      editor.chain().focus().undo().run()
    } else if (action === 'redo') {
      editor.chain().focus().redo().run()
    }
  }

  const isActive = (action: string, params?: any) => {
    if (!editor) return false
    if (action === 'toggleBold') return editor.isActive('bold')
    if (action === 'toggleItalic') return editor.isActive('italic')
    if (action === 'toggleUnderline') return editor.isActive('underline')
    if (action === 'toggleBlockquote') return editor.isActive('blockquote')
    if (action === 'toggleCodeBlock') return editor.isActive('codeBlock')
    if (action === 'toggleHeading') return editor.isActive('heading', params)
    if (action === 'toggleBulletList') return editor.isActive('bulletList')
    if (action === 'toggleOrderedList') return editor.isActive('orderedList')
    return false
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Novel Meta Editor (Title & Synopsis) */}
      <div className="glass px-4 py-2 flex flex-col gap-2 border-b border-white/5">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            value={novelMeta.title}
            onChange={(e) => setNovelMeta({ ...novelMeta, title: e.target.value })}
            placeholder="作品标题"
            className="flex-1 px-3 py-2 bg-dark-50/50 border border-white/5 rounded-md"
          />
          <button onClick={handleSave} className="px-3 py-2 rounded-md bg-gradient-primary text-white">保存</button>
        </div>
        <textarea
          value={novelMeta.synopsis}
          onChange={(e) => setNovelMeta({ ...novelMeta, synopsis: e.target.value })}
          placeholder="作品简介"
          className="w-full h-20 px-3 py-2 bg-dark-50/50 border border-white/5 rounded-md"
        />
      </div>
      {/* 标签栏 */}
      <div className="glass px-4 py-3 flex items-center gap-4 border-b border-white/5">
        <div className="flex gap-1">
          {[
            { key: 'editor', label: '✍️', text: '编辑' },
            { key: 'outline', label: '📋', text: '大纲' },
            { key: 'wiki', label: '📚', text: '设定' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm transition-all duration-200 flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-primary-600/20 text-primary-400 shadow-glow'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <span>{tab.label}</span>
              <span className="hidden sm:inline">{tab.text}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {/* Word Count */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-50/50 border border-white/5">
            <span className="text-gray-500 text-xs">字数</span>
            <span className="text-sm font-semibold text-white">{wordCount.toLocaleString()}</span>
          </div>

          {/* Status */}
          {status && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs text-violet-400">{status}</span>
            </div>
          )}

          {/* Action Buttons */}
          <button className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 border border-white/5">
            <span>📥</span>
            <span className="hidden sm:inline">导入</span>
          </button>
          <button className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 border border-white/5">
            <span>📤</span>
            <span className="hidden sm:inline">导出</span>
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Background Glow */}
        <div className="absolute left-0 top-0 w-80 h-full bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />

        {/* 大纲侧边栏 */}
        {activeTab === 'outline' && (
          <div className="w-80 glass border-r border-white/5 overflow-y-auto relative z-10">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <span>📋</span>
                  <span>章节大纲</span>
                </h3>
                <button
                  onClick={() => addOutlineNode()}
                  className="px-3 py-1.5 bg-gradient-primary rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  + 章节
                </button>
              </div>
              <div className="space-y-3">
                {outline.map((volume) => (
                  <div key={volume.id} className="rounded-xl overflow-hidden border border-white/5 bg-dark-50/30">
                    <div className="p-3 bg-dark-50/50 font-medium text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center">
                        {volume.id}
                      </span>
                      {volume.title}
                    </div>
                    <div className="p-2 space-y-1">
                      {volume.children.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="p-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition-all flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                          {chapter.title}
                        </div>
                      ))}
                      <button
                        onClick={() => addOutlineNode(volume.id)}
                        className="w-full p-2 text-xs text-gray-500 hover:text-violet-400 border border-dashed border-white/5 hover:border-violet-500/30 rounded-lg transition-all"
                      >
                        + 添加小节
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleGenerateOutline}
                className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 bg-gradient-primary hover:opacity-90"
              >
                <span>🪄</span>
                <span>AI生成大纲</span>
              </button>
            </div>
          </div>
        )}

        {/* 编辑器 */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Editor Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-violet-500/5 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto py-8 px-4 relative z-10">
            {/* 工具栏 */}
            <div className="tiptap-toolbar rounded-2xl px-4 py-3 flex items-center gap-1 mb-4 sticky top-4 z-20 shadow-card">
              {toolbarButtons.map((button, index) => {
                if ('type' in button && button.type === 'divider') {
                  return <div key={index} className="w-px h-6 bg-white/10 mx-2" />
                }
                if (!('action' in button)) return null
                
                return (
                  <button
                    key={index}
                    onClick={() => executeToolbarAction(button)}
                    title={button.label}
                    className={clsx(
                      'p-2 rounded-lg transition-all',
                      isActive(button.action, button.params) 
                        ? 'bg-primary-500/30 text-primary-400' 
                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                    )}
                  >
                    <span className={button.className || ''}>{button.icon}</span>
                  </button>
                )
              })}
              
              <div className="flex-1" />
              
              {/* AI Button */}
              <button
                onClick={handleAIWrite}
                disabled={isGenerating}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                  isGenerating
                    ? 'bg-violet-600/50 cursor-not-allowed text-violet-300'
                    : 'bg-gradient-primary hover:opacity-90 text-white shadow-glow'
                )}
              >
                <span className={isGenerating ? 'animate-spin' : ''}>🪄</span>
                <span className="font-medium">{isGenerating ? '生成中...' : 'AI续写'}</span>
              </button>
            </div>

            {/* 编辑器内容 */}
            <div className="editor-content rounded-2xl border border-white/5 shadow-card overflow-hidden">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="glass px-6 py-3 flex items-center justify-between text-sm border-t border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">字数</span>
            <span className="font-semibold text-white">{wordCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-indicator" />
            <span className="text-green-400">已连接</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>自动保存</span>
            <span className="text-green-400">✓</span>
          </div>
        </div>
        <div className="text-gray-500">
          小说创作平台 v1.0.0
        </div>
      </div>
    </div>
  )
}
