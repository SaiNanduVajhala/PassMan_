# PassMan 🛡️

**PassMan** is a secure, local-only password manager extension for Chrome and Edge. It is built with a **Zero-Knowledge Architecture**, ensuring that your master password and secret keys never leave your device.

## ✨ Features

*   **🔒 Zero-Knowledge Encryption**: Your vault is encrypted using **AES-256-GCM**, with keys derived from your master password using **PBKDF2** (SHA-256, 100k iterations).
*   **🏠 Local-Only**: No servers, no cloud storage. Your data lives in your browser's local encrypted storage.
*   **⚡ Autofill**: Automatically detects login fields and fills credentials with a single click.
*   **📸 Auto-Capture**: Detects when you log in to a new site and prompts you to save the credentials.
*   **📋 Clipboard Integration**: Quickly copy usernames and passwords to your clipboard.
*   **🖥️ Modern UI**: Clean, responsive interface built with React and Tailwind CSS.

## 🛠️ Installation

### Prerequisites
*   Node.js (v18 or higher)
*   npm

### Build Instructions

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/passman.git
    cd passman
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the extension**:
    ```bash
    npm run build
    ```
    This will generate a `dist/` directory containing the compiled extension.

### Loading into Chrome / Edge

1.  Open your browser and navigate to the extensions page:
    *   **Chrome**: `chrome://extensions`
    *   **Edge**: `edge://extensions`
2.  Enable **Developer Mode** (toggle in the top right/left corner).
3.  Click **Load Unpacked**.
4.  Select the `dist` folder located in your project directory.
5.  The **PassMan** icon should appear in your toolbar. Pining it is recommended!

## 🚀 Usage

1.  **Setup**: Click the extension icon. Create a **strong** Master Password. This password is the *only* key to your vault—if you lose it, your data is lost forever.
2.  **Add Logins**:
    *   **Manually**: Open the popup -> Unlock -> Click "Add Item".
    *   **Auto-Capture**: Log in to a website naturally. PassMan will prompt you to save the detected credentials.
3.  **Autofill**:
    *   Navigate to a login page.
    *   Open the PassMan popup.
    *   Click the **Fill** (Play icon) button next to your login entry.
4.  **Lock**: The vault automatically locks when the browser is closed or you can manually click "Lock" in the popup.

## 🛡️ Security Architecture

PassMan prioritizes security above all else:

*   **Key Derivation**: We use `PBKDF2` with `SHA-256` and 100,000 iterations to derive a strictly local encryption key from your master password.
*   **Encryption**: Data is encrypted using `AES-GCM` (256-bit) before being stored in `browser.storage.local`.
*   **Memory Safety**: The derived key is held in memory only while the vault is unlocked. It is never written to disk or local storage.
*   **Permissions**: The extension requests minimal permissions (`activeTab`, `storage`) to function.

## 💻 Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS
*   **Build Tool**: Vite
*   **Cryptography**: Web Crypto API (Native Browser Standards)
*   **Icons**: Lucide React

## 📄 License

MIT License - feel free to fork and modify for your own use!
