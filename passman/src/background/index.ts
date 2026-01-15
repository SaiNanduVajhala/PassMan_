import { runtime } from 'webextension-polyfill';
import { CapturePayload } from '../lib/types';

console.log('Background service worker started');

// In-memory storage for captured login
// This naturally clears if the service worker goes inactive, which is fine for MVP
// For production, might want slightly more persistence (chrome.storage.session)
let pendingCapture: CapturePayload | null = null;

runtime.onMessage.addListener((message: any, _sender, _sendResponse) => {
    if (message.type === 'CAPTURE_LOGIN') {
        console.log('PassMan: Received capture login', message.payload);
        pendingCapture = message.payload;
        // Optional: Badge text to indicate pending save?
        // browser.action.setBadgeText({ text: '!' });
    } else if (message.type === 'CHECK_PENDING') {
        console.log('PassMan: Checking pending capture');
        const data = pendingCapture;
        // pendingCapture = null; // Clear it after reading? Maybe wait until user acts.
        // For MVP, keep it until overwritten or saved.
        // Or clear it to prevent repeated prompts?
        // Let's clear it in the popup once handled.

        // Actually best practice: return it, popup sends 'CLEAR_PENDING' if user dismisses.
        // For now, simple consume-on-read logic is simpler but let's just return it.
        return Promise.resolve(data);
    } else if (message.type === 'CLEAR_PENDING') {
        pendingCapture = null;
    }
});

runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});
