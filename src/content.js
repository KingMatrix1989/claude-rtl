const STYLE_ID = 'claude-rtl-style';
let rtlEnabled = true; // local cache to avoid repeated storage reads

function isContextValid() {
    try {
        chrome.runtime.getURL('');
        return true;
    } catch (e) {
        return false;
    }
}

function applyRTL() {
    if (document.getElementById(STYLE_ID)) return;

    const fontURL = chrome.runtime.getURL('src/fonts/Vazirmatn-Regular.woff2');

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        @font-face {
            font-family: 'Vazirmatn';
            src: url('${fontURL}') format('woff2');
            font-weight: normal;
        }
    
        [data-testid="user-message"],
        [data-testid="assistant-message"],
        .font-claude-message,
        .font-claude-response-body,
        .standard-markdown,
        .whitespace-pre-wrap {
            direction: rtl !important;
            text-align: right !important;
            font-family: 'Vazirmatn', Tahoma, sans-serif !important;
        }

        div[contenteditable="true"], textarea {
            direction: rtl !important;
            text-align: right !important;
            font-family: 'Vazirmatn', Tahoma, sans-serif !important;
        }

        .code-block__code,
        .code-block__code * {
            direction: ltr !important;
            text-align: left !important;
            font-family: monospace !important;
        }

        code.whitespace-pre-wrap {
            direction: ltr !important;
            text-align: left !important;
            unicode-bidi: embed !important;
            display: inline-block !important;
            font-family: monospace !important;
        }
    `;
    document.head.appendChild(style);
}

function removeRTL() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
}

// اجرای اولیه
if (isContextValid()) {
    chrome.storage.local.get('rtlEnabled', ({ rtlEnabled: val }) => {
        rtlEnabled = val !== false;
        if (rtlEnabled) applyRTL();
    });
}

chrome.runtime.onMessage.addListener(({ action }) => {
    if (action === 'enable') { rtlEnabled = true; applyRTL(); }
    if (action === 'disable') { rtlEnabled = false; removeRTL(); }
});

// Re-apply stylesheet if Claude's SPA removes it from <head>.
// Debounced to avoid redundant work on rapid DOM mutations.
let debounceTimer = null;
const observer = new MutationObserver(() => {
    if (!isContextValid()) {
        observer.disconnect();
        return;
    }
    if (!rtlEnabled) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyRTL, 150);
});

observer.observe(document.body, { childList: true, subtree: true });
