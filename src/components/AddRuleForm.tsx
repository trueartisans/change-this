import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface AddRuleFormProps {
    onAdd: (search: string, replace: string) => void;
}

export function AddRuleForm({ onAdd }: AddRuleFormProps) {
    const [search, setSearch] = useState("")
    const [replace, setReplace] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!search.trim()) {
            setError("Search string is required")
            return;
        }
        onAdd(search, replace)
        setSearch("")
        setReplace("")
        setError("")
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2 border-t mt-2">
            <p className="text-xs font-medium text-muted-foreground">Add New Rule</p>
            <div className="grid grid-cols-[1fr,1fr] gap-2">
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-8 text-xs font-mono"
                />
                <Input
                    placeholder="Replace..."
                    value={replace}
                    onChange={e => setReplace(e.target.value)}
                    className="h-8 text-xs font-mono"
                />
            </div>
            <Button type="submit" size="sm" className="w-full h-8 text-xs gap-2">
                <Plus size={14} /> Add Pattern
            </Button>
            {error && <span className="text-[10px] text-destructive text-center">{error}</span>}
        </form>
    )
}
