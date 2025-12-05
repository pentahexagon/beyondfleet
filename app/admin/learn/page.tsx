'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MembershipTier, MEMBERSHIP_TIERS } from '@/types'
import {
  Plus, Edit2, Trash2, X, Search, GripVertical, Eye, EyeOff,
  Lightbulb, Link as LinkIcon, Tag, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  level: 'beginner' | 'intermediate' | 'advanced'
  thumbnail: string
  read_time: number
  required_tier: MembershipTier
  order_num: number
  created_at: string
}

interface ContentIdea {
  id: string
  title: string
  description: string
  source_url: string
  tags: string[]
  status: 'idea' | 'in_progress' | 'completed' | 'archived'
  priority: number
  created_at: string
}

const LEVEL_INFO = {
  beginner: { label: '초급', color: 'bg-green-500/20 text-green-400', icon: '🌱' },
  intermediate: { label: '중급', color: 'bg-yellow-500/20 text-yellow-400', icon: '📈' },
  advanced: { label: '고급', color: 'bg-red-500/20 text-red-400', icon: '🚀' },
}

const STATUS_INFO = {
  idea: { label: '아이디어', color: 'bg-gray-500/20 text-gray-400' },
  in_progress: { label: '작업중', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: '완료', color: 'bg-green-500/20 text-green-400' },
  archived: { label: '보관', color: 'bg-purple-500/20 text-purple-400' },
}

// Sortable Lesson Row Component
function SortableLessonRow({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: Lesson
  onEdit: (lesson: Lesson) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-purple-500/5">
      <td className="px-6 py-4 text-gray-500">
        <div
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
          {lesson.order_num}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs">
          <p className="text-white">{lesson.title}</p>
          {lesson.description && (
            <p className="text-gray-500 text-sm truncate mt-1">{lesson.description}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-sm ${LEVEL_INFO[lesson.level].color}`}>
          {LEVEL_INFO[lesson.level].icon} {LEVEL_INFO[lesson.level].label}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-gradient-to-r ${MEMBERSHIP_TIERS[lesson.required_tier].color} text-white`}>
          {MEMBERSHIP_TIERS[lesson.required_tier].icon} {MEMBERSHIP_TIERS[lesson.required_tier].nameKr}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-400">{lesson.read_time}분</td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(lesson)}
            className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(lesson.id)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function LearnManagementPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [showIdeasPanel, setShowIdeasPanel] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [previewMode, setPreviewMode] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    thumbnail: '',
    read_time: 5,
    required_tier: 'cadet' as MembershipTier,
    order_num: 0,
  })

  const [ideaFormData, setIdeaFormData] = useState({
    title: '',
    description: '',
    source_url: '',
    tags: [] as string[],
    status: 'idea' as 'idea' | 'in_progress' | 'completed' | 'archived',
    priority: 0,
  })

  const [newTag, setNewTag] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchLessons()
    fetchContentIdeas()
  }, [])

  async function fetchLessons() {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_num', { ascending: true })

      if (error) throw error
      setLessons(data || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchContentIdeas() {
    try {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .order('priority', { ascending: false })

      if (error) {
        console.log('Content ideas table may not exist yet')
        return
      }
      setContentIdeas(data || [])
    } catch (error) {
      console.error('Error fetching content ideas:', error)
    }
  }

  function openModal(lesson?: Lesson) {
    if (lesson) {
      setEditingLesson(lesson)
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        content: lesson.content,
        level: lesson.level,
        thumbnail: lesson.thumbnail || '',
        read_time: lesson.read_time,
        required_tier: lesson.required_tier,
        order_num: lesson.order_num,
      })
    } else {
      setEditingLesson(null)
      const maxOrder = lessons.reduce((max, l) => Math.max(max, l.order_num), 0)
      setFormData({
        title: '',
        description: '',
        content: '',
        level: 'beginner',
        thumbnail: '',
        read_time: 5,
        required_tier: 'cadet',
        order_num: maxOrder + 1,
      })
    }
    setPreviewMode(false)
    setShowModal(true)
  }

  function openIdeaModal(idea?: ContentIdea) {
    if (idea) {
      setEditingIdea(idea)
      setIdeaFormData({
        title: idea.title,
        description: idea.description || '',
        source_url: idea.source_url || '',
        tags: idea.tags || [],
        status: idea.status,
        priority: idea.priority,
      })
    } else {
      setEditingIdea(null)
      setIdeaFormData({
        title: '',
        description: '',
        source_url: '',
        tags: [],
        status: 'idea',
        priority: 0,
      })
    }
    setShowIdeaModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            level: formData.level,
            thumbnail: formData.thumbnail || null,
            read_time: formData.read_time,
            required_tier: formData.required_tier,
            order_num: formData.order_num,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLesson.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            level: formData.level,
            thumbnail: formData.thumbnail || null,
            read_time: formData.read_time,
            required_tier: formData.required_tier,
            order_num: formData.order_num,
          })

        if (error) throw error
      }

      setShowModal(false)
      fetchLessons()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('강의 저장 중 오류가 발생했습니다.')
    }
  }

  async function handleIdeaSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingIdea) {
        const { error } = await supabase
          .from('content_ideas')
          .update({
            title: ideaFormData.title,
            description: ideaFormData.description,
            source_url: ideaFormData.source_url || null,
            tags: ideaFormData.tags,
            status: ideaFormData.status,
            priority: ideaFormData.priority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingIdea.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('content_ideas')
          .insert({
            title: ideaFormData.title,
            description: ideaFormData.description,
            source_url: ideaFormData.source_url || null,
            tags: ideaFormData.tags,
            status: ideaFormData.status,
            priority: ideaFormData.priority,
          })

        if (error) throw error
      }

      setShowIdeaModal(false)
      fetchContentIdeas()
    } catch (error) {
      console.error('Error saving idea:', error)
      alert('아이디어 저장 중 오류가 발생했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchLessons()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('강의 삭제 중 오류가 발생했습니다.')
    }
  }

  async function handleIdeaDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchContentIdeas()
    } catch (error) {
      console.error('Error deleting idea:', error)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id)
      const newIndex = lessons.findIndex((l) => l.id === over.id)

      const newLessons = arrayMove(lessons, oldIndex, newIndex)

      // Update order_num for all affected lessons
      const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        order_num: index + 1,
      }))

      setLessons(updatedLessons)

      // Update in database
      try {
        for (const lesson of updatedLessons) {
          await supabase
            .from('lessons')
            .update({ order_num: lesson.order_num })
            .eq('id', lesson.id)
        }
      } catch (error) {
        console.error('Error updating order:', error)
        fetchLessons() // Revert on error
      }
    }
  }

  function addTag() {
    if (newTag.trim() && !ideaFormData.tags.includes(newTag.trim())) {
      setIdeaFormData({
        ...ideaFormData,
        tags: [...ideaFormData.tags, newTag.trim()],
      })
      setNewTag('')
    }
  }

  function removeTag(tag: string) {
    setIdeaFormData({
      ...ideaFormData,
      tags: ideaFormData.tags.filter((t) => t !== tag),
    })
  }

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = filterLevel === 'all' || lesson.level === filterLevel
    return matchesSearch && matchesLevel
  })

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">교육 콘텐츠 관리</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIdeasPanel(!showIdeasPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            콘텐츠 아이디어
            {contentIdeas.length > 0 && (
              <span className="bg-cyan-400/30 px-2 py-0.5 rounded-full text-xs">
                {contentIdeas.filter((i) => i.status === 'idea').length}
              </span>
            )}
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            새 강의 추가
          </button>
        </div>
      </div>

      {/* Content Ideas Panel */}
      {showIdeasPanel && (
        <div className="bg-space-800 rounded-xl border border-cyan-500/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-cyan-400" />
              콘텐츠 아이디어
            </h2>
            <button
              onClick={() => openIdeaModal()}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              새 아이디어
            </button>
          </div>

          {contentIdeas.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              아직 저장된 아이디어가 없습니다. 새 아이디어를 추가해보세요!
            </p>
          ) : (
            <div className="space-y-3">
              {contentIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-start justify-between p-4 bg-space-900 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium">{idea.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_INFO[idea.status].color}`}>
                        {STATUS_INFO[idea.status].label}
                      </span>
                    </div>
                    {idea.description && (
                      <p className="text-gray-400 text-sm mb-2">{idea.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {idea.source_url && (
                        <a
                          href={idea.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          <LinkIcon className="w-3 h-3" />
                          참고 링크
                        </a>
                      )}
                      {idea.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openIdeaModal(idea)}
                      className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleIdeaDelete(idea.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="강의 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-4 py-2 bg-space-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">전체 레벨</option>
          <option value="beginner">🌱 초급</option>
          <option value="intermediate">📈 중급</option>
          <option value="advanced">🚀 고급</option>
        </select>
      </div>

      {/* Lessons Table with Drag & Drop */}
      <div className="bg-space-800 rounded-xl border border-purple-500/20 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full">
            <thead className="bg-space-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-20">순서</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">제목</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">레벨</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">필요 등급</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">읽는 시간</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              <SortableContext
                items={filteredLessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredLessons.map((lesson) => (
                  <SortableLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    onEdit={openModal}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            등록된 강의가 없습니다.
          </div>
        )}
      </div>

      {/* Lesson Modal with Markdown Editor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-space-800 rounded-xl border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20 sticky top-0 bg-space-800 z-10">
              <h2 className="text-xl font-semibold text-white">
                {editingLesson ? '강의 수정' : '새 강의 추가'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    previewMode
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-600/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {previewMode ? '편집' : '미리보기'}
                </button>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">본문 (Markdown)</label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-space-900 rounded">**굵게**</span>
                    <span className="px-2 py-1 bg-space-900 rounded">*이탤릭*</span>
                    <span className="px-2 py-1 bg-space-900 rounded">## 제목</span>
                    <span className="px-2 py-1 bg-space-900 rounded">```코드```</span>
                  </div>
                </div>

                {previewMode ? (
                  <div className="w-full min-h-[400px] px-4 py-3 bg-space-900 border border-purple-500/20 rounded-lg text-gray-300 prose prose-invert prose-sm max-w-none overflow-auto">
                    <div dangerouslySetInnerHTML={{
                      __html: formData.content
                        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
                        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
                        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/`(.+?)`/g, '<code class="bg-purple-500/20 px-1 rounded">$1</code>')
                        .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                        .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
                        .replace(/\n\n/g, '</p><p class="mb-4">')
                        .replace(/\n/g, '<br>')
                    }} />
                  </div>
                ) : (
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    placeholder="마크다운 형식으로 작성하세요...

## 제목

본문 내용을 작성합니다.

### 소제목

- 리스트 아이템 1
- 리스트 아이템 2

**굵은 텍스트**, *이탤릭*

```
코드 블록
```"
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">레벨</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="beginner">🌱 초급</option>
                    <option value="intermediate">📈 중급</option>
                    <option value="advanced">🚀 고급</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">필요 등급</label>
                  <select
                    value={formData.required_tier}
                    onChange={(e) => setFormData({ ...formData, required_tier: e.target.value as MembershipTier })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {Object.entries(MEMBERSHIP_TIERS).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.icon} {info.nameKr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">읽는 시간 (분)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">순서</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_num}
                    onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">썸네일 URL</label>
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://picsum.photos/seed/lesson-name/800/400"
                  className="w-full px-4 py-2 bg-space-900 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  {editingLesson ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Idea Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-space-800 rounded-xl border border-cyan-500/20 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-cyan-400" />
                {editingIdea ? '아이디어 수정' : '새 콘텐츠 아이디어'}
              </h2>
              <button onClick={() => setShowIdeaModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleIdeaSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                <input
                  type="text"
                  required
                  value={ideaFormData.title}
                  onChange={(e) => setIdeaFormData({ ...ideaFormData, title: e.target.value })}
                  placeholder="예: DeFi 농사 전략 정리"
                  className="w-full px-4 py-2 bg-space-900 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">메모</label>
                <textarea
                  value={ideaFormData.description}
                  onChange={(e) => setIdeaFormData({ ...ideaFormData, description: e.target.value })}
                  rows={3}
                  placeholder="아이디어 상세 내용..."
                  className="w-full px-4 py-2 bg-space-900 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  참고 링크
                </label>
                <input
                  type="url"
                  value={ideaFormData.source_url}
                  onChange={(e) => setIdeaFormData({ ...ideaFormData, source_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-space-900 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  태그
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {ideaFormData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="태그 입력 후 Enter"
                    className="flex-1 px-4 py-2 bg-space-900 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
                  >
                    추가
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">상태</label>
                  <select
                    value={ideaFormData.status}
                    onChange={(e) => setIdeaFormData({ ...ideaFormData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-space-900 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="idea">아이디어</option>
                    <option value="in_progress">작업중</option>
                    <option value="completed">완료</option>
                    <option value="archived">보관</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">우선순위</label>
                  <select
                    value={ideaFormData.priority}
                    onChange={(e) => setIdeaFormData({ ...ideaFormData, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-space-900 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={0}>보통</option>
                    <option value={1}>높음</option>
                    <option value={2}>긴급</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowIdeaModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  {editingIdea ? '수정' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
