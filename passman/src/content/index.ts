import browser from 'webextension-polyfill';
import { AutofillMessage } from '../lib/types';

console.log('PassMan content script loaded');

// Helper to find the best password field
function findPasswordInput(): HTMLInputElement | null {
    const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    if (passwordInputs.length === 0) return null;

    // Simple heuristic: return the first visible one
    // In a real app, we'd check visibility, aria-hidden, etc.
    return Array.from(passwordInputs).find(input => input.offsetParent !== null) || passwordInputs[0];
}

// Helper to find the associated username field for a password field
function findUsernameInput(passwordInput: HTMLInputElement): HTMLInputElement | null {
    // 1. Check for a preceding text/email input in the same form
    const form = passwordInput.form;
    if (form) {
        const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]):not([type="submit"]):not([type="button"])'));
        const index = inputs.indexOf(passwordInput);
        if (index > 0) {
            return inputs[index - 1];
        }
    }

    // 2. Fallback: Search previous siblings
    let prev = passwordInput.previousElementSibling;
    while (prev) {
        if (prev instanceof HTMLInputElement && (prev.type === 'text' || prev.type === 'email')) {
            return prev;
        }
        prev = prev.previousElementSibling;
    }

    return null;
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === 'FILL_LOGIN') {
        const { username, password } = (message as AutofillMessage).payload;

        const passwordInput = findPasswordInput();
        if (passwordInput) {
            passwordInput.value = password;
            // Trigger events for frameworks like React/Angular
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

            const usernameInput = findUsernameInput(passwordInput);
            if (usernameInput) {
                usernameInput.value = username;
                usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
                usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            console.log('PassMan: Auto-filled credentials');
        } else {
            console.warn('PassMan: No password field found to fill');
        }
    }
});

// Auto-Capture Logic
document.addEventListener('submit', (e) => {
    const target = e.target as HTMLElement;

    // Find password field within the submitted form
    const passwordInput = target.querySelector('input[type="password"]') as HTMLInputElement;
    if (!passwordInput || !passwordInput.value) return;

    // Find associated username
    const usernameInput = findUsernameInput(passwordInput);
    if (!usernameInput || !usernameInput.value) return;

    // Send capture message
    const message = {
        type: 'CAPTURE_LOGIN',
        payload: {
            username: usernameInput.value,
            password: passwordInput.value,
            url: window.location.href,
            siteName: window.location.hostname
        }
    };

    browser.runtime.sendMessage(message).catch(err => {
        // Ignore errors if background is redundant
        console.log('PassMan capture sent', err);
    });
}, true); // Capture phase to catch it before propagation stops
