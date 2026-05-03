import { Calendar, Swords, Users, BarChart3, Mic } from 'lucide-react'

interface ChatToolbarProps {
  onPracticeClick: () => void
  onGameClick: () => void
  onLinesClick: () => void
  onPollClick: () => void
  onMemoClick: () => void
}

export function ChatToolbar({
  onPracticeClick,
  onGameClick,
  onLinesClick,
  onPollClick,
  onMemoClick
}: ChatToolbarProps) {
  const tools = [
    { label: 'Practice', icon: Calendar, onClick: onPracticeClick },
    { label: 'Game Link', icon: Swords, onClick: onGameClick },
    { label: 'Lines', icon: Users, onClick: onLinesClick },
    { label: 'Poll', icon: BarChart3, onClick: onPollClick },
    { label: 'Memo', icon: Mic, onClick: onMemoClick },
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {tools.map((tool) => (
        <button 
          key={tool.label}
          onClick={tool.onClick}
          className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 border border-white/5 bg-zinc-900/50 hover:bg-primary hover:text-primary-foreground transition-all shrink-0 px-4"
        >
          <tool.icon className="w-3 h-3" />
          {tool.label}
        </button>
      ))}
    </div>
  )
}
