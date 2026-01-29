import { useRules } from "./hooks/useRules"
import { RuleCard } from "./components/RuleCard"
import { AddRuleForm } from "./components/AddRuleForm"
import { Switch } from "./components/ui/switch"
import { Layers, Loader2 } from "lucide-react"

function App() {
  const { masterSwitch, rules, loading, toggleMasterSwitch, addRule, updateRule, deleteRule } = useRules()

  if (loading) {
    return (
      <div className="w-[350px] h-[400px] flex items-center justify-center bg-background text-foreground">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-[350px] h-[500px] flex flex-col bg-background text-foreground p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <Layers className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">Change This</h1>
            <p className="text-[10px] text-muted-foreground">URL Replacer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${masterSwitch ? 'text-primary' : 'text-muted-foreground'}`}>
            {masterSwitch ? 'ON' : 'OFF'}
          </span>
          <Switch checked={masterSwitch} onCheckedChange={toggleMasterSwitch} />
        </div>
      </header>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2">
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
            <Layers size={32} />
            <p className="text-xs">No active rules</p>
          </div>
        ) : (
          rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onUpdate={updateRule}
              onDelete={deleteRule}
            />
          ))
        )}
      </div>

      {/* Add Form */}
      <div className="mt-auto">
        <AddRuleForm onAdd={addRule} />
      </div>
    </div>
  )
}

export default App
