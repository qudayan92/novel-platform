import { Router } from 'express'

export const wikiRouter = Router()

const mockWikiEntries = [
  {
    id: '1',
    novelId: '1',
    name: '林墨',
    type: 'character',
    description: '男主角，性格冷静克制，不轻易表现恐惧。自幼被神秘组织收养，学习古武与现代科技的融合之道。',
    traits: ['冷静', '克制', '重情义'],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    novelId: '1',
    name: '古币',
    type: 'item',
    description: '开启幽冥之门的钥匙，会在危险临近时发热。材质古朴，刻有未知铭文。',
    traits: ['神秘', '古老'],
    createdAt: new Date().toISOString()
  }
]

wikiRouter.get('/', (req, res) => {
  const { novelId, type } = req.query
  let entries = mockWikiEntries
  
  if (novelId) {
    entries = entries.filter(e => e.novelId === novelId)
  }
  if (type) {
    entries = entries.filter(e => e.type === type)
  }
  
  res.json({ success: true, data: entries })
})

wikiRouter.get('/:id', (req, res) => {
  const entry = mockWikiEntries.find(e => e.id === req.params.id)
  if (!entry) {
    return res.status(404).json({ success: false, error: '条目不存在' })
  }
  res.json({ success: true, data: entry })
})

wikiRouter.post('/', (req, res) => {
  const { novelId, name, type, description, traits } = req.body
  const newEntry = {
    id: Date.now().toString(),
    novelId,
    name,
    type,
    description,
    traits: traits || [],
    createdAt: new Date().toISOString()
  }
  mockWikiEntries.push(newEntry)
  res.json({ success: true, data: newEntry })
})

wikiRouter.put('/:id', (req, res) => {
  const index = mockWikiEntries.findIndex(e => e.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: '条目不存在' })
  }
  mockWikiEntries[index] = { ...mockWikiEntries[index], ...req.body }
  res.json({ success: true, data: mockWikiEntries[index] })
})

wikiRouter.delete('/:id', (req, res) => {
  const index = mockWikiEntries.findIndex(e => e.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: '条目不存在' })
  }
  mockWikiEntries.splice(index, 1)
  res.json({ success: true })
})

wikiRouter.post('/search', (req, res) => {
  const { query } = req.body
  
  const results = mockWikiEntries.filter(entry => {
    const searchText = `${entry.name} ${entry.description}`.toLowerCase()
    return searchText.includes(query.toLowerCase())
  })
  
  res.json({ success: true, data: results })
})
