interface WikiEntry {
  id: string
  name: string
  type: 'character' | 'location' | 'item' | 'setting'
  description: string
  keywords: string[]
}

const mockWikiDatabase: WikiEntry[] = [
  {
    id: '1',
    name: '林墨',
    type: 'character',
    description: '男主角，性格冷静克制，不轻易表现恐惧。自幼被神秘组织收养。',
    keywords: ['林墨', '男主', '冷静', '古币']
  },
  {
    id: '2',
    name: '姬紫月',
    type: 'character',
    description: '女主角，古灵精怪，出身神秘世家，掌握虚空经。',
    keywords: ['姬紫月', '女主', '虚空经']
  },
  {
    id: '3',
    name: '古币',
    type: 'item',
    description: '开启幽冥之门的钥匙，会在危险临近时发热。',
    keywords: ['古币', '幽冥之门', '钥匙', '发热']
  },
  {
    id: '4',
    name: '青云镇',
    type: 'location',
    description: '表面平静的边陲小镇，实则暗流涌动。',
    keywords: ['青云镇', '小镇', '边陲']
  },
  {
    id: '5',
    name: '幽冥之门',
    type: 'setting',
    description: '传说中连接生死的通道，被古币封印。',
    keywords: ['幽冥之门', '封印', '传说', '危险']
  }
]

export class WikiService {
  private database: WikiEntry[] = mockWikiDatabase

  searchRelated(text: string, limit = 5): WikiEntry[] {
    const words = text.toLowerCase().split(/[\s，。、！？""''（）【】『』,.\-]+/)
    
    const scored = this.database.map(entry => {
      let score = 0
      
      for (const word of words) {
        if (!word) continue
        
        if (entry.name.toLowerCase().includes(word)) {
          score += 10
        }
        
        if (entry.keywords.some(k => k.toLowerCase().includes(word))) {
          score += 5
        }
        
        if (entry.description.toLowerCase().includes(word)) {
          score += 2
        }
      }
      
      return { entry, score }
    })

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.entry)
  }

  getAll(): WikiEntry[] {
    return this.database
  }

  getByType(type: WikiEntry['type']): WikiEntry[] {
    return this.database.filter(e => e.type === type)
  }

  addEntry(entry: Omit<WikiEntry, 'id'>): WikiEntry {
    const newEntry: WikiEntry = {
      ...entry,
      id: Date.now().toString()
    }
    this.database.push(newEntry)
    return newEntry
  }

  updateEntry(id: string, updates: Partial<WikiEntry>): WikiEntry | null {
    const index = this.database.findIndex(e => e.id === id)
    if (index === -1) return null
    
    this.database[index] = { ...this.database[index], ...updates }
    return this.database[index]
  }

  deleteEntry(id: string): boolean {
    const index = this.database.findIndex(e => e.id === id)
    if (index === -1) return false
    
    this.database.splice(index, 1)
    return true
  }
}

export const wikiService = new WikiService()
