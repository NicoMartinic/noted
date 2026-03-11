'use client';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6366f1', '#64748b', '#c8820a', '#1a1410',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  error?: string;
}

export default function ColorPicker({ value, onChange, error }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-ink-600 dark:text-ink-400 uppercase tracking-wider">Color</label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-8 h-8 rounded-full transition-all duration-150 hover:scale-110"
            style={{
              backgroundColor: color,
              outline: value === color ? `3px solid ${color}` : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-cream-200 dark:border-ink-700" style={{ backgroundColor: value }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-amber-accent/40"
          placeholder="#6366f1"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
