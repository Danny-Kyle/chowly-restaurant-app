'use client'

type Role = 'customer' | 'waiter'

export default function RoleToggle({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div className="inline-flex rounded-sm border border-line bg-paper-raised p-1 font-data text-xs uppercase tracking-wide">
      {(['customer', 'waiter'] as Role[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-4 py-2 rounded-sm transition-colors ${
            role === r ? 'bg-accent text-paper-raised' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
