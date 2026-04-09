import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/novel_platform'
})

export interface Chapter {
  id: string
  title: string
  content: string
  wordCount: number
  orderIndex: number
}

export interface NovelForExport {
  id: string
  title: string
  authorName: string
  synopsis: string
  coverUrl: string | null
  category: string
  tags: string[]
  chapters: Chapter[]
  totalWords: number
}

export interface ExportResult {
  format: 'txt' | 'html' | 'epub' | 'markdown'
  content: string | Buffer
  filename: string
  mimeType: string
  size: number
}

class FormatConverter {
  toTxt(novel: NovelForExport): ExportResult {
    let content = `${novel.title}\n`
    content += `作者：${novel.authorName}\n`
    content += `${'='.repeat(50)}\n\n`
    
    if (novel.synopsis) {
      content += `【简介】\n${novel.synopsis}\n\n`
      content += `${'='.repeat(50)}\n\n`
    }

    for (const chapter of novel.chapters) {
      content += `${chapter.title}\n\n`
      content += `${chapter.content}\n\n`
      content += `${'─'.repeat(30)}\n\n`
    }

    const buffer = Buffer.from(content, 'utf-8')
    
    return {
      format: 'txt',
      content: buffer,
      filename: `${this.sanitizeFilename(novel.title)}.txt`,
      mimeType: 'text/plain',
      size: buffer.length
    }
  }

  toHtml(novel: NovelForExport): ExportResult {
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(novel.title)}</title>
  <style>
    body {
      font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
      background: #f5f5f5;
    }
    .novel-header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    .novel-title {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .novel-author {
      color: #666;
      margin-bottom: 15px;
    }
    .novel-synopsis {
      color: #555;
      text-align: left;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .chapter {
      background: white;
      margin-bottom: 30px;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    .chapter-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    .chapter-content {
      text-indent: 2em;
    }
    .chapter-content p {
      margin-bottom: 15px;
    }
    @media print {
      body { background: white; }
      .chapter { box-shadow: none; page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="novel-header">
    <h1 class="novel-title">${this.escapeHtml(novel.title)}</h1>
    <div class="novel-author">作者：${this.escapeHtml(novel.authorName)}</div>
    ${novel.synopsis ? `<div class="novel-synopsis">${this.escapeHtml(novel.synopsis)}</div>` : ''}
  </div>
`

    for (const chapter of novel.chapters) {
      html += `
  <div class="chapter">
    <h2 class="chapter-title">${this.escapeHtml(chapter.title)}</h2>
    <div class="chapter-content">${this.formatContentHtml(chapter.content)}</div>
  </div>
`
    }

    html += `
</body>
</html>`

    const buffer = Buffer.from(html, 'utf-8')
    
    return {
      format: 'html',
      content: buffer,
      filename: `${this.sanitizeFilename(novel.title)}.html`,
      mimeType: 'text/html',
      size: buffer.length
    }
  }

  toMarkdown(novel: NovelForExport): ExportResult {
    let md = `# ${novel.title}\n\n`
    md += `**作者：** ${novel.authorName}\n\n`
    
    if (novel.synopsis) {
      md += `## 简介\n\n${novel.synopsis}\n\n`
    }

    md += `---\n\n`
    md += `## 目录\n\n`
    
    for (const chapter of novel.chapters) {
      md += `- [${chapter.title}](#${this.toSlug(chapter.title)})\n`
    }
    md += `\n---\n\n`

    for (const chapter of novel.chapters) {
      md += `### ${chapter.title}\n\n`
      md += `${chapter.content.replace(/\n\n/g, '\n\n')}\n\n`
      md += `---\n\n`
    }

    const buffer = Buffer.from(md, 'utf-8')
    
    return {
      format: 'markdown',
      content: buffer,
      filename: `${this.sanitizeFilename(novel.title)}.md`,
      mimeType: 'text/markdown',
      size: buffer.length
    }
  }

  toEpub(novel: NovelForExport): ExportResult {
    const chapters = novel.chapters.map((ch, index) => ({
      id: `chapter-${index + 1}`,
      title: ch.title,
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${this.escapeHtml(ch.title)}</title></head>
<body>
<h1>${this.escapeHtml(ch.title)}</h1>
${this.formatContentHtml(ch.content)}
</body>
</html>`
    }))

    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:title>${this.escapeHtml(novel.title)}</dc:title>
    <dc:creator>${this.escapeHtml(novel.authorName)}</dc:creator>
    <dc:language>zh-CN</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${chapters.map(ch => `<item id="${ch.id}" href="${ch.id}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  <spine>
    <itemref idref="nav"/>
    ${chapters.map(ch => `<itemref idref="${ch.id}"/>`).join('\n    ')}
  </spine>
</package>`

    let navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>目录</title></head>
<body>
<nav epub:type="toc">
<h1>目录</h1>
<ol>
${chapters.map(ch => `<li><a href="${ch.id}.xhtml">${this.escapeHtml(ch.title)}</a></li>`).join('\n')}
</ol>
</nav>
</body>
</html>`

    const epubStructure = {
      'META-INF/container.xml': containerXml,
      'OEBPS/content.opf': contentOpf,
      'OEBPS/nav.xhtml': navXhtml,
      ...Object.fromEntries(chapters.map(ch => [`OEBPS/${ch.id}.xhtml`, ch.content]))
    }

    const description = {
      files: epubStructure,
      note: '实际EPUB生成需要压缩为ZIP文件'
    }

    const buffer = Buffer.from(JSON.stringify(description, null, 2))
    
    return {
      format: 'epub',
      content: buffer,
      filename: `${this.sanitizeFilename(novel.title)}.epub`,
      mimeType: 'application/epub+zip',
      size: buffer.length
    }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').substring(0, 100)
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private formatContentHtml(content: string): string {
    return content
      .split(/\n\n+/)
      .map(p => `<p>${this.escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
      .join('\n')
  }

  private toSlug(text: string): string {
    return encodeURIComponent(text.replace(/\s+/g, '-'))
  }
}

export const formatConverter = new FormatConverter()

export class PublishService {
  async getPlatform(name: string) {
    const result = await pool.query(
      'SELECT * FROM publish_platforms WHERE name = $1 AND is_active = true',
      [name]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async getAllPlatforms() {
    const result = await pool.query(
      'SELECT * FROM publish_platforms WHERE is_active = true ORDER BY name'
    )
    return result.rows
  }

  async createSubmission(data: {
    novelId: string
    userId: string
    platformId: string
    title: string
    authorName: string
    category: string
    tags: string[]
    synopsis: string
    coverUrl?: string
  }) {
    const result = await pool.query(
      `INSERT INTO publish_submissions 
       (novel_id, user_id, platform_id, title, author_name, category, tags, synopsis, cover_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
       RETURNING *`,
      [data.novelId, data.userId, data.platformId, data.title, data.authorName, data.category, data.tags, data.synopsis, data.coverUrl]
    )

    return result.rows[0]
  }

  async getSubmission(submissionId: string) {
    const result = await pool.query(
      `SELECT ps.*, pp.name as platform_name, pp.display_name as platform_display_name
       FROM publish_submissions ps
       JOIN publish_platforms pp ON ps.platform_id = pp.id
       WHERE ps.id = $1`,
      [submissionId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async getSubmissionsByUser(userId: string) {
    const result = await pool.query(
      `SELECT ps.*, pp.name as platform_name, pp.display_name as platform_display_name,
              n.title as novel_title
       FROM publish_submissions ps
       JOIN publish_platforms pp ON ps.platform_id = pp.id
       JOIN novels n ON ps.novel_id = n.id
       WHERE ps.user_id = $1
       ORDER BY ps.created_at DESC`,
      [userId]
    )
    return result.rows
  }

  async addSubmissionChapters(submissionId: string, chapters: Chapter[]) {
    for (const chapter of chapters) {
      await pool.query(
        `INSERT INTO submission_chapters (submission_id, chapter_id, title, content, word_count, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [submissionId, chapter.id, chapter.title, chapter.content, chapter.wordCount, chapter.orderIndex]
      )
    }

    const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    await pool.query(
      `UPDATE publish_submissions 
       SET total_words = $1, chapter_count = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [totalWords, chapters.length, submissionId]
    )
  }

  async getSubmissionChapters(submissionId: string) {
    const result = await pool.query(
      `SELECT * FROM submission_chapters WHERE submission_id = $1 ORDER BY order_index`,
      [submissionId]
    )
    return result.rows
  }

  async submitToPlatform(submissionId: string): Promise<{ success: boolean; message: string; platformNovelId?: string }> {
    const submission = await this.getSubmission(submissionId)
    if (!submission) {
      return { success: false, message: '投稿记录不存在' }
    }

    const platform = await this.getPlatform(submission.platform_name)
    if (!platform) {
      return { success: false, message: '平台不存在或已禁用' }
    }

    await pool.query(
      `UPDATE publish_submissions 
       SET status = 'pending', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [submissionId]
    )

    try {
      const chapters = await this.getSubmissionChapters(submissionId)
      const platformResult = await this.submitToFanqie(submission, chapters, platform)
      
      if (platformResult.success) {
        await pool.query(
          `UPDATE publish_submissions 
           SET status = 'reviewing', platform_novel_id = $1, platform_url = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [platformResult.novelId, platformResult.url, submissionId]
        )
      }

      return platformResult
    } catch (error) {
      await pool.query(
        `UPDATE publish_submissions SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [submissionId]
      )
      throw error
    }
  }

  private async submitToFanqie(
    submission: any, 
    chapters: any[], 
    platform: any
  ): Promise<{ success: boolean; message: string; novelId?: string; url?: string }> {
    console.log(`[模拟] 投稿到番茄小说: ${submission.title}`)
    console.log(`[模拟] 章节数: ${chapters.length}`)
    console.log(`[模拟] 总字数: ${submission.total_words}`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockNovelId = `FQ${Date.now()}`
    
    return {
      success: true,
      message: '投稿成功，等待平台审核',
      novelId: mockNovelId,
      url: `https://fanqienovel.com/page/${mockNovelId}`
    }
  }

  async updateSubmissionStatus(
    submissionId: string, 
    status: string, 
    data?: { 
      platformNovelId?: string
      platformUrl?: string
      rejectReason?: string
      reviewNotes?: string
    }
  ) {
    const updates: string[] = ['status = $2', 'updated_at = CURRENT_TIMESTAMP']
    const values: any[] = [submissionId, status]
    let paramIndex = 3

    if (data?.platformNovelId) {
      updates.push(`platform_novel_id = $${paramIndex++}`)
      values.push(data.platformNovelId)
    }
    if (data?.platformUrl) {
      updates.push(`platform_url = $${paramIndex++}`)
      values.push(data.platformUrl)
    }
    if (data?.rejectReason) {
      updates.push(`reject_reason = $${paramIndex++}`)
      values.push(data.rejectReason)
    }
    if (data?.reviewNotes) {
      updates.push(`review_notes = $${paramIndex++}`)
      values.push(data.reviewNotes)
    }

    if (status === 'reviewing') {
      updates.push('reviewed_at = CURRENT_TIMESTAMP')
    }
    if (status === 'published') {
      updates.push('published_at = CURRENT_TIMESTAMP')
    }

    await pool.query(
      `UPDATE publish_submissions SET ${updates.join(', ')} WHERE id = $1`,
      values
    )
  }

  async recordStats(submissionId: string, stats: {
    viewCount?: number
    likeCount?: number
    commentCount?: number
    favoriteCount?: number
    income?: number
  }) {
    const today = new Date().toISOString().split('T')[0]
    
    await pool.query(
      `INSERT INTO submission_stats 
       (submission_id, stat_date, view_count, like_count, comment_count, favorite_count, income)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (submission_id, stat_date) 
       DO UPDATE SET 
         view_count = $3, like_count = $4, comment_count = $5, 
         favorite_count = $6, income = $7`,
      [submissionId, today, stats.viewCount || 0, stats.likeCount || 0, stats.commentCount || 0, stats.favoriteCount || 0, stats.income || 0]
    )
  }

  async getSubmissionStats(submissionId: string, days: number = 30) {
    const result = await pool.query(
      `SELECT * FROM submission_stats 
       WHERE submission_id = $1 AND stat_date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY stat_date DESC`,
      [submissionId]
    )
    return result.rows
  }

  async deleteSubmission(submissionId: string, userId: string) {
    const result = await pool.query(
      `DELETE FROM publish_submissions WHERE id = $1 AND user_id = $2 AND status IN ('draft', 'rejected')`,
      [submissionId, userId]
    )
    return result.rowCount > 0
  }
}

export const publishService = new PublishService()
