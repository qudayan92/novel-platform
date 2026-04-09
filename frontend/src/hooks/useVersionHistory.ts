import { useState, useCallback, useRef } from 'react'

interface Version {
  id: string
  timestamp: Date
  content: string
  description?: string
}

export function useVersionHistory(initialContent: string) {
  const [versions, setVersions] = useState<Version[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000),
      content: initialContent,
      description: '初始版本'
    }
  ])
  const [currentVersionId, setCurrentVersionId] = useState('1')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createVersion = useCallback((content: string, description?: string) => {
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: new Date(),
      content,
      description
    }
    setVersions(prev => [newVersion, ...prev])
    setCurrentVersionId(newVersion.id)
    return newVersion
  }, [])

  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId)
    if (version) {
      setCurrentVersionId(versionId)
      return version.content
    }
    return null
  }, [versions])

  const startAutoSave = useCallback((content: string, interval = 60000) => {
    if (autoSaveTimer.current) {
      clearInterval(autoSaveTimer.current)
    }
    
    let lastContent = content
    
    autoSaveTimer.current = setInterval(() => {
      if (content !== lastContent) {
        createVersion(content, '自动保存')
        lastContent = content
      }
    }, interval)
  }, [createVersion])

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearInterval(autoSaveTimer.current)
      autoSaveTimer.current = null
    }
  }, [])

  const getDiff = useCallback((versionId1: string, versionId2: string) => {
    const v1 = versions.find(v => v.id === versionId1)
    const v2 = versions.find(v => v.id === versionId2)
    
    if (!v1 || !v2) return null
    
    return {
      added: v2.content.length - v1.content.length,
      description: `${v1.description || '版本1'} → ${v2.description || '版本2'}`
    }
  }, [versions])

  return {
    versions,
    currentVersionId,
    createVersion,
    restoreVersion,
    startAutoSave,
    stopAutoSave,
    getDiff
  }
}
