'use client';
import { ToolId } from '@/lib/audit/types';
import { TOOL_NAMES } from '@/lib/audit/pricing';

const TOOL_ICONS: Record<ToolId, string> = {
  cursor: '🖱️', 'github-copilot': '🐙', claude: '🔮', chatgpt: '💬',
  'anthropic-api': '🧠', 'openai-api': '🤖', gemini: '♊', windsurf: '🏄',
};

const ALL_TOOLS: ToolId[] = [
  'cursor', 'github-copilot', 'claude', 'chatgpt',
  'anthropic-api', 'openai-api', 'gemini', 'windsurf',
];

interface Props {
  selectedTools: ToolId[];
  onAdd: (id: ToolId) => void;
  onRemove: (id: ToolId) => void;
}

export default function ToolSelector({ selectedTools, onAdd, onRemove }: Props) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Select AI Tools You Pay For
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {ALL_TOOLS.map((toolId) => {
          const active = selectedTools.includes(toolId);
          return (
            <button key={toolId}
              onClick={() => active ? onRemove(toolId) : onAdd(toolId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px',
                borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                color: active ? '#a5b4fc' : '#666', fontFamily: 'inherit',
              }}>
              <span>{TOOL_ICONS[toolId]}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {TOOL_NAMES[toolId]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}