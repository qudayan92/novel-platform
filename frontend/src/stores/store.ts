import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Novel {
  id: string
  title: string
  synopsis: string
  genre: string
  wordCount: number
  chapters: Chapter[]
  wikiEntries: WikiEntry[]
  outline: OutlineNode[]
}

interface Chapter {
  id: string
  title: string
  content: string
  orderIndex: number
  wordCount: number
}

interface WikiEntry {
  id: string
  name: string
  type: 'character' | 'location' | 'item' | 'setting' | 'faction'
  description: string
  traits?: string[]
  relations?: { name: string; type: string }[]
}

interface OutlineNode {
  id: string
  title: string
  content: string
  children: OutlineNode[]
}

interface WritingStats {
  dailyWordCount: number
  weeklyWordCount: number
  totalWordCount: number
  streak: number
}

interface AppState {
  currentNovel: Novel | null
  writingStats: WritingStats
  
  setCurrentNovel: (novel: Novel | null) => void
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void
  addChapter: (chapter: Chapter) => void
  deleteChapter: (chapterId: string) => void
  updateWordCount: (count: number) => void
  
  addWikiEntry: (entry: WikiEntry) => void
  updateWikiEntry: (id: string, updates: Partial<WikiEntry>) => void
  deleteWikiEntry: (id: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentNovel: null,
      writingStats: {
        dailyWordCount: 0,
        weeklyWordCount: 0,
        totalWordCount: 0,
        streak: 0
      },

      setCurrentNovel: (novel) => set({ currentNovel: novel }),

      updateChapter: (chapterId, updates) =>
        set((state) => {
          if (!state.currentNovel) return state
          const chapters = state.currentNovel.chapters.map((ch) =>
            ch.id === chapterId ? { ...ch, ...updates } : ch
          )
          return {
            currentNovel: { ...state.currentNovel, chapters }
          }
        }),

      addChapter: (chapter) =>
        set((state) => {
          if (!state.currentNovel) return state
          return {
            currentNovel: {
              ...state.currentNovel,
              chapters: [...state.currentNovel.chapters, chapter]
            }
          }
        }),

      deleteChapter: (chapterId) =>
        set((state) => {
          if (!state.currentNovel) return state
          return {
            currentNovel: {
              ...state.currentNovel,
              chapters: state.currentNovel.chapters.filter((ch) => ch.id !== chapterId)
            }
          }
        }),

      updateWordCount: (count) =>
        set((state) => ({
          writingStats: {
            ...state.writingStats,
            dailyWordCount: state.writingStats.dailyWordCount + count,
            totalWordCount: state.writingStats.totalWordCount + count
          }
        })),

      addWikiEntry: (entry) =>
        set((state) => {
          if (!state.currentNovel) return state
          return {
            currentNovel: {
              ...state.currentNovel,
              wikiEntries: [...state.currentNovel.wikiEntries, entry]
            }
          }
        }),

      updateWikiEntry: (id, updates) =>
        set((state) => {
          if (!state.currentNovel) return state
          const wikiEntries = state.currentNovel.wikiEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          )
          return { currentNovel: { ...state.currentNovel, wikiEntries } }
        }),

      deleteWikiEntry: (id) =>
        set((state) => {
          if (!state.currentNovel) return state
          return {
            currentNovel: {
              ...state.currentNovel,
              wikiEntries: state.currentNovel.wikiEntries.filter((e) => e.id !== id)
            }
          }
        })
    }),
    {
      name: 'novel-platform-storage'
    }
  )
)
