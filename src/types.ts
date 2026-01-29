export interface Rule {
    id: string;
    active: boolean;
    search: string;
    replace: string;
    preserveAuth: boolean;
    capturedHeaders?: Record<string, string>;
}

export interface AppState {
    masterSwitch: boolean;
    rules: Rule[];
}

export const STORAGE_KEY = 'change-this-config';
