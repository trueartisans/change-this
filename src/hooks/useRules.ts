import { useEffect, useState } from 'react';
import { type Rule, type AppState, STORAGE_KEY } from '../types';

const DEFAULT_STATE: AppState = {
    masterSwitch: true,
    rules: [],
};

export function useRules() {
    const [config, setConfig] = useState<AppState>(DEFAULT_STATE);
    const [loading, setLoading] = useState(true);

    // Load initial state
    useEffect(() => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (result[STORAGE_KEY]) {
                setConfig((result[STORAGE_KEY] as AppState));
            } else {
                // Initialize if empty
                chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_STATE });
            }
            setLoading(false);
        });

        // Listen for changes (e.g. from other contexts or sync) generally good practice
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local' && changes[STORAGE_KEY]) {
                setConfig(changes[STORAGE_KEY].newValue as AppState);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    const saveConfig = (newConfig: AppState) => {
        setConfig(newConfig); // Optimistic update
        chrome.storage.local.set({ [STORAGE_KEY]: newConfig });
    };

    const addRule = (search: string, replace: string) => {
        const newRule: Rule = {
            id: crypto.randomUUID(),
            active: true,
            search,
            replace,
            preserveAuth: true
        };
        saveConfig({ ...config, rules: [...config.rules, newRule] });
    };

    const updateRule = (id: string, updates: Partial<Rule>) => {
        const newRules = config.rules.map(r => r.id === id ? { ...r, ...updates } : r);
        saveConfig({ ...config, rules: newRules });
    };

    const deleteRule = (id: string) => {
        const newRules = config.rules.filter(r => r.id !== id);
        saveConfig({ ...config, rules: newRules });
    };

    const toggleMasterSwitch = () => {
        saveConfig({ ...config, masterSwitch: !config.masterSwitch });
    };

    return {
        masterSwitch: config.masterSwitch,
        rules: config.rules,
        loading,
        addRule,
        updateRule,
        deleteRule,
        toggleMasterSwitch
    };
}
