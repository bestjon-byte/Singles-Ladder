import { readFileSync } from 'fs'
import { join } from 'path'
import { BookOpen } from 'lucide-react'

export default function UserGuideContent() {
  // Read the USER_GUIDE.md file from the project root
  const guideContent = readFileSync(join(process.cwd(), 'USER_GUIDE.md'), 'utf-8')

  // Convert markdown to HTML with Tailwind classes
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let inCodeBlock = false
    let key = 0

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${key++}`} className="list-disc list-inside space-y-2 mb-6 ml-4 text-gray-700 dark:text-gray-300">
            {currentList.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        )
        currentList = []
      }
    }

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        flushList()
        elements.push(
          <h1 key={`h1-${key++}`} className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4 mt-8 first:mt-0">
            {line.substring(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        flushList()
        elements.push(
          <h2 key={`h2-${key++}`} className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3 mt-8 pb-2 border-b border-gray-200 dark:border-gray-700">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        elements.push(
          <h3 key={`h3-${key++}`} className="text-2xl font-heading font-semibold text-gray-900 dark:text-white mb-3 mt-6">
            {line.substring(4)}
          </h3>
        )
      }
      // Horizontal rule
      else if (line.trim() === '---') {
        flushList()
        elements.push(
          <hr key={`hr-${key++}`} className="my-8 border-gray-300 dark:border-gray-700" />
        )
      }
      // Lists
      else if (line.match(/^(\d+\.|-)\s/)) {
        const content = line.replace(/^(\d+\.|-)\s/, '').trim()
        // Handle bold in list items
        const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
        currentList.push(formattedContent)
      }
      // Bold text in paragraphs
      else if (line.includes('**') && !line.startsWith('#')) {
        flushList()
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
        elements.push(
          <p key={`p-${key++}`} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
        )
      }
      // Regular paragraphs
      else if (line.trim() && !line.startsWith('#')) {
        flushList()
        elements.push(
          <p key={`p-${key++}`} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            {line}
          </p>
        )
      }
      // Empty lines
      else if (!line.trim()) {
        flushList()
      }
    })

    flushList()
    return elements
  }

  return (
    <div className="card p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-12 h-12 rounded-full bg-gradient-purple flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            User Guide
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Everything you need to know about the Singles Ladder
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {renderMarkdown(guideContent)}
      </div>
    </div>
  )
}
