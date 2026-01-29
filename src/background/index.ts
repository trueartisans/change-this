import { type AppState, STORAGE_KEY } from '../types';

// Unsafe headers that Chrome refuses to modify or are dangerous to copy blindly
const UNSAFE_HEADERS = new Set([
    'host',
    'connection',
    'content-length',
    'expect',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'cookie',               // Managed by browser usually, copying might break things or be duplicate
    'sec-ch-ua',            // Browser controlled
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'sec-fetch-dest',
    'sec-fetch-mode',
    'sec-fetch-site',
    'sec-fetch-user',
    'user-agent'            // Often browser controlled, but we can try to copy. Safer to skip to let destination browser handle it.
]);

// Utility to escape regex characters in search string
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function updateRules() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const state: AppState = (result[STORAGE_KEY] as AppState) || { masterSwitch: true, rules: [] };

    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map(rule => rule.id);

    // If Master Switch is OFF, remove all rules and exit
    if (!state.masterSwitch) {
        if (currentRuleIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: currentRuleIds,
                addRules: [],
            });
            console.log('Master switch OFF: All rules removed.');
        }
        return;
    }

    // Filter active rules and valid rules
    const activeRules = state.rules.filter(r => r.active && r.search);

    const dnrRules: chrome.declarativeNetRequest.Rule[] = [];

    activeRules.forEach((rule, index) => {
        const escapedSearch = escapeRegExp(rule.search);
        const redirectRuleId = index + 1;
        const requestHeadersRuleId = index + 20000;
        const responseHeadersRuleId = index + 40000;

        // 1. Redirection Conditions
        const hasHeaders = rule.capturedHeaders && Object.keys(rule.capturedHeaders).length > 0;
        const shouldRedirect = !rule.preserveAuth || (rule.preserveAuth && hasHeaders);

        // If we need to preserve auth but don't have headers yet, we skip the redirect rule.
        // This allows the request to go through to the origin, triggering onBeforeSendHeaders.
        if (shouldRedirect) {
            dnrRules.push({
                id: redirectRuleId,
                priority: 1,
                action: {
                    type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                    redirect: {
                        regexSubstitution: `\\1${rule.replace}\\2`
                    }
                },
                condition: {
                    regexFilter: `^(.*?)${escapedSearch}(.*)$`,
                    resourceTypes: [
                        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                        chrome.declarativeNetRequest.ResourceType.STYLESHEET,
                        chrome.declarativeNetRequest.ResourceType.SCRIPT,
                        chrome.declarativeNetRequest.ResourceType.IMAGE,
                        chrome.declarativeNetRequest.ResourceType.FONT,
                        chrome.declarativeNetRequest.ResourceType.OBJECT,
                        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                        chrome.declarativeNetRequest.ResourceType.PING,
                        chrome.declarativeNetRequest.ResourceType.CSP_REPORT,
                        chrome.declarativeNetRequest.ResourceType.MEDIA,
                        chrome.declarativeNetRequest.ResourceType.WEBSOCKET,
                        chrome.declarativeNetRequest.ResourceType.OTHER
                    ]
                }
            });
        }

        // 2. Request Header Modification Rule (Mirroring) (Priority 2)
        if (rule.preserveAuth && hasHeaders) {
            const requestHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[] = Object.entries(rule.capturedHeaders!).map(([name, value]) => ({
                header: name,
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: value
            }));

            dnrRules.push({
                id: requestHeadersRuleId,
                priority: 2,
                action: {
                    type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                    requestHeaders: requestHeaders
                },
                condition: {
                    // Match the DESTINATION (Replaced string)
                    urlFilter: rule.replace,
                    resourceTypes: [
                        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                        chrome.declarativeNetRequest.ResourceType.SCRIPT,
                        chrome.declarativeNetRequest.ResourceType.OTHER
                    ]
                }
            });
        }

        // 3. Response Header Modification Rule (CORS Bypass) (Priority 2)
        if (shouldRedirect) {
            dnrRules.push({
                id: responseHeadersRuleId,
                priority: 2,
                action: {
                    type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                    responseHeaders: [
                        { header: 'Access-Control-Allow-Origin', operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: '*' },
                        { header: 'Access-Control-Allow-Methods', operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH' },
                        { header: 'Access-Control-Allow-Headers', operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: '*' }
                    ]
                },
                condition: {
                    urlFilter: rule.replace,
                    resourceTypes: [
                        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                        chrome.declarativeNetRequest.ResourceType.SCRIPT,
                        chrome.declarativeNetRequest.ResourceType.OTHER
                    ]
                }
            });
        }
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: currentRuleIds,
        addRules: dnrRules,
    });

    console.log('Rules updated:', dnrRules.length);
}

// Sniffer to capture ALL headers (Mirror)
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (!details.requestHeaders) return;

        // Check if this request matches any of our rules' SEARCH strings
        // We only capture from the ORIGIN (before redirect)
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            const state: AppState = result[STORAGE_KEY] as AppState;
            if (!state || !state.masterSwitch) return;

            let changed = false;
            const newRules = state.rules.map(rule => {
                if (rule.active && rule.preserveAuth && details.url.includes(rule.search)) {

                    // Capture headers
                    const newCapturedHeaders: Record<string, string> = {};
                    let headersChanged = false;

                    // Previous headers or empty
                    const oldHeaders = rule.capturedHeaders || {};

                    details.requestHeaders?.forEach(h => {
                        const name = h.name.toLowerCase();
                        if (!UNSAFE_HEADERS.has(name) && h.value) {
                            newCapturedHeaders[h.name] = h.value;

                            // Check change
                            if (oldHeaders[h.name] !== h.value) {
                                headersChanged = true;
                            }
                        }
                    });

                    // Also check if keys length changed (removed headers)
                    if (Object.keys(oldHeaders).length !== Object.keys(newCapturedHeaders).length) {
                        headersChanged = true;
                    }

                    if (headersChanged) {
                        rule.capturedHeaders = newCapturedHeaders;
                        changed = true;
                        console.log(`[Mirror] Captured ${Object.keys(newCapturedHeaders).length} headers from ${rule.search}`);
                    }
                }
                return rule;
            });

            if (changed) {
                chrome.storage.local.set({ [STORAGE_KEY]: { ...state, rules: newRules } });
            }
        });

        return undefined;
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders", "extraHeaders"] // extraHeaders required for some secured headers
);

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
        updateRules();
    }
});

// Initial load
chrome.runtime.onInstalled.addListener(() => {
    updateRules();
});

updateRules();
