# Tab Hide & Restore Chrome Extension

A Chrome Extension that lets you **temporarily hide all tabs to the right of the active tab** and restore them later with one click. This helps reduce browser clutter and improve focus without losing your open tabs.

---

## Features

- **Context menu integration:** Right-click any tab to quickly hide or restore tabs to its right.
- **Minimized hidden window:** Hidden tabs are moved into a minimized Chrome window, keeping them out of sight but preserved.
- **Persistent state management:** Uses `chrome.storage.local` to track and restore tabs even across browser restarts.
- **Fast toggling:** One-click hide and restore functionality.
- **No permissions overreach:** Requests minimal permissions required (`tabs`, `storage`, `contextMenus`) for privacy and security.

---

## Architecture & Technical Details

### Manifest Version 3

- Uses Chrome Manifest V3 with a **service worker** background script (`background.js`) for event handling.
- Implements a **context menu** item dynamically updated based on extension state.

### State Management

- Extension state (`originalWindowId`, `hiddenWindowId`, and `hiddenTabIds`) is stored in `chrome.storage.local`.
- On hiding tabs, stores all right-side tab IDs and their original window.
- On restore, moves tabs back and removes the hidden minimized window.

### Tab & Window Manipulation

- Utilizes `chrome.tabs.query` to get all tabs in the active window.
- Filters tabs by index relative to the active tab to find the "right" tabs.
- Uses `chrome.windows.create` and `chrome.tabs.move` to organize tabs.
- Ensures the original window stays focused after operations.

### Error Handling

- Wraps restore logic in a try/catch to handle edge cases like closed windows or tabs.
- Clears stored state on errors to prevent stale data issues.

---

## Installation & Usage

1. Clone or download the repo.

2. Open Chrome and navigate to `chrome://extensions`.

3. Enable **Developer mode** (toggle top right).

4. Click **Load unpacked** and select the extension folder.

5. Right-click any tab and select **Hide all tabs to the right** to hide them.

6. Right-click again and select **Show all hidden tabs** to restore.

---

## Permissions

- `"tabs"` — to query and move tabs.
- `"storage"` — to persist hidden tab state.
- `"contextMenus"` — to add a right-click menu option.

---

## Future Improvements

- Add keyboard shortcuts for toggling hide/show.
- Option to restore tabs in a new window instead of original.
- Support for multi-window tab hiding.
- Popup UI for manual tab management and overview.

---

## Contributing

Contributions, bug reports, and feature requests are welcome! Feel free to open issues or submit pull requests.



