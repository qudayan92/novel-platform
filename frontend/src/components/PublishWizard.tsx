import { useState, useEffect } from 'react'
import { publishAPI, Platform, Submission, SensitiveCheckResult } from '@/api/publish'
import { useAuthStore } from '@/stores/authStore'

interface PublishWizardProps {
  isOpen: boolean
  onClose: () => void
  novel: {
    id: string
    title: string
    synopsis?: string
    chapters: Array<{ id: string; title: string; content: string; wordCount: number }>
    totalWords: number
  }
  onPublished?: (submissionId: string) => void
}

type Step = 'select' | 'info' | 'check' | 'submit' | 'done'

export function PublishWizard({ isOpen, onClose, novel, onPublished }: PublishWizardProps) {
  const accessToken = useAuthStore(state => state.accessToken)
  const user = useAuthStore(state => state.user)

  const [step, setStep] = useState<Step>('select')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [sensitiveResult, setSensitiveResult] = useState<SensitiveCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: novel.title,
    authorName: user?.displayName || user?.username || '',
    category: '玄幻',
    tags: [] as string[],
    synopsis: novel.synopsis || ''
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (isOpen && accessToken) {
      publishAPI.getPlatforms(accessToken).then(setPlatforms)
    }
  }, [isOpen, accessToken])

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      title: novel.title,
      synopsis: novel.synopsis || '',
      authorName: user?.displayName || user?.username || ''
    }))
  }, [novel, user])

  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatform(platform)
    setStep('info')
  }

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim()) && form.tags.length < 5) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleNextFromInfo = async () => {
    if (!accessToken || !selectedPlatform) return
    setLoading(true)
    setError('')

    try {
      const result = await publishAPI.createSubmission({
        novelId: novel.id,
        platformId: selectedPlatform.id,
        title: form.title,
        authorName: form.authorName,
        category: form.category,
        tags: form.tags,
        synopsis: form.synopsis,
        chapters: novel.chapters
      }, accessToken)

      const newSubmission = await publishAPI.getSubmission(result.id, accessToken)
      setSubmission(newSubmission as Submission)
      setStep('check')

      const checkResult = await publishAPI.checkSubmission(result.id, accessToken)
      setSensitiveResult(checkResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建投稿失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!accessToken || !submission) return
    setLoading(true)
    setError('')

    try {
      await publishAPI.submitToPlatform(submission.id, accessToken)
      setStep('done')
      onPublished?.(submission.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', marginBottom: 24 }}>
      {['选择平台', '填写信息', '内容检测', '提交审核'].map((label, index) => {
        const stepOrder: Step[] = ['select', 'info', 'check', 'submit']
        const currentIndex = stepOrder.indexOf(step)
        const isActive = index === currentIndex
        const isPast = index < currentIndex

        return (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isActive ? 'var(--accent-blue)' : isPast ? 'var(--accent-green)' : 'var(--bg-tertiary)',
              color: isActive || isPast ? 'white' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600
            }}>
              {isPast ? '✓' : index + 1}
            </div>
            <div style={{ fontSize: 12, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>📤 投稿到平台</h2>
          <button className="toolbar-btn" onClick={onClose}>✕</button>
        </div>

        {step !== 'done' && renderStepIndicator()}

        {step === 'select' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: 'var(--text-secondary)' }}>选择投稿平台：</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {platforms.map(platform => (
                <div
                  key={platform.id}
                  onClick={() => handleSelectPlatform(platform)}
                  style={{
                    padding: 16,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.transform = ''
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{platform.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    最低字数：{platform.minWordCount.toLocaleString()} 字
                  </div>
                  {novel.totalWords < platform.minWordCount && (
                    <div style={{ fontSize: 12, color: 'var(--accent-orange)', marginTop: 8 }}>
                      ⚠️ 当前字数不足
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'info' && selectedPlatform && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>投稿平台：</span>
              <span style={{ fontWeight: 600 }}>{selectedPlatform.displayName}</span>
            </div>

            <div className="form-group">
              <label className="form-label">作品标题 *</label>
              <input
                type="text"
                className="form-input"
                value={form.title}
                onChange={e => handleInputChange('title', e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label className="form-label">作者名 *</label>
              <input
                type="text"
                className="form-input"
                value={form.authorName}
                onChange={e => handleInputChange('authorName', e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label className="form-label">分类</label>
              <select
                className="form-input"
                value={form.category}
                onChange={e => handleInputChange('category', e.target.value)}
              >
                {selectedPlatform.supportedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">标签（最多5个）</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入标签"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  style={{ flex: 1 }}
                />
                <button className="btn-secondary" onClick={handleAddTag}>添加</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 100,
                      fontSize: 13
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      style={{ marginLeft: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">简介</label>
              <textarea
                className="form-input"
                value={form.synopsis}
                onChange={e => handleInputChange('synopsis', e.target.value)}
                rows={4}
                maxLength={500}
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep('select')}>上一步</button>
              <button className="btn-primary" onClick={handleNextFromInfo} disabled={loading}>
                {loading ? '处理中...' : '下一步'}
              </button>
            </div>
          </div>
        )}

        {step === 'check' && sensitiveResult && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: sensitiveResult.riskLevel === 'safe' ? 'var(--accent-green)' 
                    : sensitiveResult.riskLevel === 'high' ? '#ef4444' : 'var(--accent-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  {sensitiveResult.riskLevel === 'safe' ? '✓' : '⚠️'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18 }}>
                    {sensitiveResult.riskLevel === 'safe' ? '内容安全'
                      : sensitiveResult.riskLevel === 'high' ? '存在高风险内容'
                      : '存在需关注的内容'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    总字数 {sensitiveResult.totalWords.toLocaleString()} · 
                    敏感词 {sensitiveResult.sensitiveCount} 个
                  </div>
                </div>
              </div>

              {sensitiveResult.matches.length > 0 && (
                <div style={{ 
                  maxHeight: 200, 
                  overflowY: 'auto', 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: 8, 
                  padding: 12 
                }}>
                  {sensitiveResult.matches.slice(0, 20).map((match, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: index < Math.min(sensitiveResult.matches.length, 20) - 1 ? '1px solid var(--border-color)' : 'none'
                    }}>
                      <div>
                        <span style={{ color: 'var(--accent-orange)', fontWeight: 500 }}>{match.word}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                          {match.category} · {match.severity}
                        </span>
                      </div>
                      {match.suggestion && (
                        <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>
                          建议: {match.suggestion}
                        </span>
                      )}
                    </div>
                  ))}
                  {sensitiveResult.matches.length > 20 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '8px 0' }}>
                      还有 {sensitiveResult.matches.length - 20} 个...
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep('info')}>上一步</button>
              <button 
                className="btn-primary" 
                onClick={handleSubmit} 
                disabled={loading || sensitiveResult.riskLevel === 'high'}
              >
                {sensitiveResult.riskLevel === 'high' ? '请修改内容后重试' : loading ? '提交中...' : '提交审核'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && submission && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              margin: '0 auto 20px'
            }}>
              ✓
            </div>
            <h3 style={{ marginBottom: 12 }}>投稿成功！</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              您的作品已提交审核，通常需要1-3个工作日<br/>
              审核结果将通过站内消息通知您
            </p>
            <div style={{ 
              padding: 16, 
              background: 'var(--bg-tertiary)', 
              borderRadius: 12, 
              marginBottom: 20,
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>作品：</span>
                <span>{submission.title}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>平台：</span>
                <span>{submission.platformDisplayName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>投稿ID：</span>
                <span style={{ fontFamily: 'monospace' }}>{submission.id.slice(0, 8)}...</span>
              </div>
            </div>
            <button className="btn-primary" onClick={onClose}>完成</button>
          </div>
        )}
      </div>
    </div>
  )
}

export function SubmissionList({ onViewDetail }: { onViewDetail: (id: string) => void }) {
  const accessToken = useAuthStore(state => state.accessToken)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) {
      publishAPI.getSubmissions(accessToken)
        .then(setSubmissions)
        .finally(() => setLoading(false))
    }
  }, [accessToken])

  const statusColors: Record<string, string> = {
    draft: 'var(--text-muted)',
    pending: 'var(--accent-blue)',
    reviewing: 'var(--accent-yellow)',
    published: 'var(--accent-green)',
    rejected: '#ef4444'
  }

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    reviewing: '审核中',
    published: '已发布',
    rejected: '已拒绝'
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>加载中...</div>
  }

  if (submissions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        暂无投稿记录
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {submissions.map(sub => (
        <div
          key={sub.id}
          style={{
            padding: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            cursor: 'pointer'
          }}
          onClick={() => onViewDetail(sub.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>{sub.title}</span>
            <span style={{
              padding: '4px 12px',
              background: statusColors[sub.status] + '20',
              color: statusColors[sub.status],
              borderRadius: 100,
              fontSize: 12
            }}>
              {statusLabels[sub.status]}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {sub.platformDisplayName} · {sub.totalWords.toLocaleString()} 字 · {sub.chapterCount} 章
          </div>
          {sub.rejectReason && (
            <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>
              拒绝原因：{sub.rejectReason}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
