import { Trash2, Key, ShieldCheck } from "lucide-react"
import { type Rule } from "@/types"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Switch } from "./ui/switch"
import { Input } from "./ui/input"
import { useState, useEffect } from "react"

interface RuleCardProps {
    rule: Rule;
    onUpdate: (id: string, updates: Partial<Rule>) => void;
    onDelete: (id: string) => void;
}

export function RuleCard({ rule, onUpdate, onDelete }: RuleCardProps) {
    const [search, setSearch] = useState(rule.search);
    const [replace, setReplace] = useState(rule.replace);

    useEffect(() => {
        setSearch(rule.search);
        setReplace(rule.replace);
    }, [rule]);

    return (
        <Card className="p-3 mb-2 flex flex-col gap-2 bg-card/50">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Switch
                        checked={rule.active}
                        onCheckedChange={(checked) => onUpdate(rule.id, { active: checked })}
                    />
                    {rule.preserveAuth && (!rule.capturedHeaders || Object.keys(rule.capturedHeaders).length === 0) && (
                        <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold animate-pulse">
                            <ShieldCheck size={12} /> Sniffing...
                        </div>
                    )}
                    {rule.capturedHeaders && Object.keys(rule.capturedHeaders).length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                            <Key size={12} /> {Object.keys(rule.capturedHeaders).length} Headers
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1.5 mr-2">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Auth</span>
                        <Switch
                            className="scale-75 h-4 w-7"
                            checked={rule.preserveAuth}
                            onCheckedChange={(checked) => onUpdate(rule.id, { preserveAuth: checked })}
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(rule.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-xs">
                <div className="flex flex-col gap-1">
                    <label className="text-muted-foreground font-mono uppercase text-[10px] flex items-center gap-1">
                        Search {rule.capturedHeaders && <ShieldCheck size={10} className="text-primary" />}
                    </label>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onBlur={() => onUpdate(rule.id, { search })}
                        className="h-7 text-xs font-mono bg-background/50"
                        placeholder="google.com"
                    />
                </div>
                <span className="text-muted-foreground pt-4">→</span>
                <div className="flex flex-col gap-1">
                    <label className="text-muted-foreground font-mono uppercase text-[10px]">Replace</label>
                    <Input
                        value={replace}
                        onChange={(e) => setReplace(e.target.value)}
                        onBlur={() => onUpdate(rule.id, { replace })}
                        className="h-7 text-xs font-mono bg-background/50"
                        placeholder="localhost:3000"
                    />
                </div>
            </div>
        </Card>
    )
}

