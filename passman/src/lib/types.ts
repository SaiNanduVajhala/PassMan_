export interface VaultEntry {
    id: string;
    domain: string;
    username: string; // Encrypted (base64)
    password: string; // Encrypted (base64)
    siteName: string;
    notes?: string;   // Encrypted (base64)
    created: number;
    modified: number;
}

export interface EncryptedVault {
    version: number;
    salt: string;    // Base64
    data: string;    // Base64 (Ciphertext of VaultEntry[])
    iv: string;      // Base64
    kdfParams: {
        algo: "PBKDF2";
        iterations: number;
        hash: "SHA-256";
    };
}

export interface DecryptedVault {
    entries: VaultEntry[];
}

export interface AutofillMessage {
    type: 'FILL_LOGIN';
    payload: {
        username: string;
        password: string;
    };
}

export interface CapturePayload {
    username: string;
    password: string;
    url: string;
    siteName: string;
}

export interface CaptureLoginMessage {
    type: 'CAPTURE_LOGIN';
    payload: CapturePayload;
}

export interface CheckPendingMessage {
    type: 'CHECK_PENDING';
}
