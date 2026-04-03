import { Router } from 'express'
import { aiDetectionService, AIDetectionResult } from '../services/aiDetectionService'

export const aiDetectRouter = Router()

const mockChapters = [
  { id: '1', title: '第一章 觉醒', content: '幽暗的地下室中，一盏昏黄的油灯摇曳着微弱的光芒。李轩缓缓睁开眼睛，发现自己躺在一张冰冷的石床上。他揉了揉太阳穴，试图回忆之前发生的事情。\n\n"这是哪里？"他喃喃自语，声音在空旷的石室中回荡。\n\n李轩挣扎着坐起身，环顾四周。墙壁上布满了古老的符文，散发着淡淡的蓝光。他记得自己明明是在图书馆里研究那本神秘的古籍，怎么突然来到了这个地方？\n\n就在这时，一道苍老的声音在他脑海中响起："欢迎来到幽冥界，年轻的旅人。"\n\n李轩猛然一惊，四处张望，却看不到任何人影。"你是谁？"他问道。\n\n"我是这座幽冥宫殿的守护者，"那声音说道，"你已经触发了古老的传送阵，被带到了这个与人间界平行的时间和空间。"\n\n李轩努力让自己冷静下来。他是一名历史系的大学生，对古代神话和神秘学有着浓厚的兴趣。那本古籍是他在研究过程中偶然发现的，上面记载着关于幽冥界的传说。\n\n"我该怎么回去？"李轩问道。\n\n"要回到人间界，你需要找到三把钥匙，"守护者说道，"它们分别藏在幽冥宫殿的不同角落。只有集齐三把钥匙，才能打开返回人间界的传送门。"\n\n李轩深吸一口气，开始在这个陌生的世界中探索。', wordCount: 520 },
  { id: '2', title: '第二章 幽冥之门', content: '宫殿的走廊幽深而漫长，两侧的墙壁上雕刻着各种各样的图案。有腾云驾雾的神龙，有展翅高飞的凤凰，还有各种奇异的怪兽。李轩小心翼翼地向前走着，脚步声在空旷的走廊中回响。\n\n走着走着，他来到了一扇巨大的石门前。石门上刻着三个神秘的符文，与墙壁上的那些符文相互呼应。\n\n"这就是第一道关卡，"守护者的声音再次响起，"只有解开符文的秘密，才能打开这扇门。"\n\n李轩仔细观察着石门上的符文。他发现这些符文似乎遵循着某种规律，它们分别代表着金、木、水、火、土五行。他开始尝试着将符文按正确的顺序排列。\n\n经过多次尝试，石门终于缓缓打开。门后是一个宽敞的大厅，大厅中央放着一个古老的宝箱。李轩走上前去，打开宝箱，里面赫然放着一把金色的钥匙。\n\n"第一把钥匙找到了！"他兴奋地说道。\n\n"不错，"守护者说道，"但接下来的挑战会更加困难。"\n\n李轩将钥匙收入怀中，继续向前走去。他知道，这只是开始，还有更多的挑战在等待着他。', wordCount: 480 },
  { id: '3', title: '第三章 新的开始', content: '离开大厅后，李轩进入了一片茂密的森林。这里的树木高大而古老，枝叶交织在一起，遮住了大部分阳光。森林中弥漫着一层淡淡的雾气，让人难以看清前方的道路。\n\n就在这时，一阵沙沙的声音从树丛中传来。李轩立刻警惕起来，握紧了拳头。\n\n"别紧张，"一个清脆的声音响起，"我不是敌人。"\n\n从树丛中走出一个少女，她有着一头银色的长发，眼睛如同星辰般明亮。少女穿着白色的长裙，衣袂飘飘，仿佛不食人间烟火的仙子。\n\n"我叫灵月，"少女微笑道，"是这片森林的守护者。"\n\n李轩松了一口气，拱手道："我是李轩，来自人间界。"\n\n灵月点了点头："我知道你此行的目的。要找到第二把钥匙，你需要穿过迷雾森林，到达森林尽头的月湖。在那里，有一座古老的神庙，钥匙就藏在神庙中。"\n\n"但是，"灵月的表情变得严肃起来，"森林中有许多危险的生物，你必须小心。"\n\n李轩谢过灵月，踏入了迷雾森林。他知道，前方的道路充满了未知，但他已经准备好了。', wordCount: 510 }
]

const mockResults: Map<string, AIDetectionResult> = new Map()

aiDetectRouter.post('/chapter', async (req, res) => {
  try {
    const { chapterId, content } = req.body

    if (!content) {
      return res.status(400).json({ success: false, error: '章节内容不能为空' })
    }

    const result = await aiDetectionService.detectChapter(chapterId || 'temp', content)

    mockResults.set(`chapter-${chapterId || Date.now()}`, result)

    res.json({
      success: true,
      data: {
        id: `result-${Date.now()}`,
        chapterId,
        detectionType: 'chapter',
        ...result
      }
    })
  } catch (error) {
    console.error('AI detection error:', error)
    res.status(500).json({ success: false, error: '检测失败' })
  }
})

aiDetectRouter.post('/novel', async (req, res) => {
  try {
    const { novelId, chapterIds } = req.body

    let chaptersToAnalyze = mockChapters
    if (chapterIds && chapterIds.length > 0) {
      chaptersToAnalyze = mockChapters.filter(c => chapterIds.includes(c.id))
    }

    const result = await aiDetectionService.detectNovel(
      chaptersToAnalyze.map(c => ({ id: c.id, title: c.title, content: c.content }))
    )

    const resultId = `novel-result-${Date.now()}`
    mockResults.set(resultId, result.overall)

    res.json({
      success: true,
      data: {
        id: resultId,
        novelId,
        detectionType: 'novel',
        ...result
      }
    })
  } catch (error) {
    console.error('AI detection error:', error)
    res.status(500).json({ success: false, error: '检测失败' })
  }
})

aiDetectRouter.get('/:id', (req, res) => {
  const result = mockResults.get(req.params.id)

  if (!result) {
    return res.status(404).json({ success: false, error: '检测结果不存在' })
  }

  res.json({ success: true, data: result })
})

aiDetectRouter.get('/patterns/list', async (req, res) => {
  const patterns = [
    { modelName: 'GPT-4', patterns: ['过度使用连接词', '机械化的对比结构', '过度使用的四字词语'] },
    { modelName: 'Claude', patterns: ['超长复合句', '学术化开头语', '过度描写内心情感'] },
    { modelName: 'DeepSeek', patterns: ['过度使用的逻辑链', '机械化的步骤结构', '过度使用的总结词'] },
    { modelName: 'Gemini', patterns: ['多角度并列结构', '过度使用视角切换'] },
    { modelName: 'Wenxin', patterns: ['过度使用的成语', '对仗工整结构', '过度使用的情感词'] },
    { modelName: 'Doubao', patterns: ['过度使用反问句', '口语化表达'] },
    { modelName: 'Yuanbao', patterns: ['网络流行语', '过度使用的口头禅'] }
  ]

  res.json({ success: true, data: patterns })
})

aiDetectRouter.get('/history/:novelId', (req, res) => {
  const history = [
    {
      id: 'history-1',
      novelId: req.params.novelId,
      detectionType: 'novel',
      humanScore: 65,
      suspectedAIScore: 25,
      aiScore: 10,
      riskLevel: 'low',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'history-2',
      novelId: req.params.novelId,
      detectionType: 'chapter',
      humanScore: 58,
      suspectedAIScore: 30,
      aiScore: 12,
      riskLevel: 'low',
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ]

  res.json({ success: true, data: history })
})

aiDetectRouter.post('/batch-chapter', async (req, res) => {
  try {
    const { chapters } = req.body

    if (!chapters || !Array.isArray(chapters)) {
      return res.status(400).json({ success: false, error: '章节列表不能为空' })
    }

    const results = []
    for (const chapter of chapters) {
      const result = await aiDetectionService.detectChapter(chapter.id, chapter.content)
      results.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        result
      })
    }

    res.json({
      success: true,
      data: {
        total: chapters.length,
        results
      }
    })
  } catch (error) {
    console.error('Batch detection error:', error)
    res.status(500).json({ success: false, error: '批量检测失败' })
  }
})