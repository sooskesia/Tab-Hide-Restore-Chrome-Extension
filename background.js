const CONTEXT_MENU_ID = "toggle-hide-right-tabs";

// Retrieve the saved state from local storage
async function getState() {
  const result = await chrome.storage.local.get(['originalWindowId', 'hiddenWindowId', 'hiddenTabIds']);
  return {
    originalWindowId: result.originalWindowId || null,
    hiddenWindowId: result.hiddenWindowId || null,
    hiddenTabIds: result.hiddenTabIds || []
  };
}

// Save the current state back to storage
async function setState(state) {
  await chrome.storage.local.set(state);
}

// Clear the stored state when done
async function clearState() {
  await chrome.storage.local.remove(['originalWindowId', 'hiddenWindowId', 'hiddenTabIds']);
}

// Change the context menu text depending on whether tabs are hidden or not
async function updateContextMenuTitle() {
  const { hiddenWindowId } = await getState();
  const title = hiddenWindowId ? "Show all hidden tabs" : "Hide all tabs to the right";
  chrome.contextMenus.update(CONTEXT_MENU_ID, { title });
}

// Create the context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Hide all tabs to the right",  // default menu text
    contexts: ["tab"]
  });
});

// Make sure menu title is set correctly when extension starts
updateContextMenuTitle();

// Handle user clicking the context menu item
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Only respond if this is our menu item
  if (info.menuItemId !== CONTEXT_MENU_ID) return;

  // Get current state
  const { originalWindowId, hiddenWindowId, hiddenTabIds } = await getState();

  // If tabs aren’t hidden yet, hide all tabs to the right of clicked tab
  if (!hiddenWindowId) {
    if (!tab) return; // just in case

    const windowId = tab.windowId;
    const allTabs = await chrome.tabs.query({ windowId });

    // Find all tabs to the right of the active tab (higher index)
    const rightTabs = allTabs.filter(t => t.index > tab.index);
    if (rightTabs.length === 0) {
      // Nothing to hide, so just exit
      return;
    }

    const rightTabIds = rightTabs.map(t => t.id);

    // Create a new minimized window with the first tab to hide
    const newWindow = await chrome.windows.create({ tabId: rightTabIds[0], state: "minimized" });

    // Move remaining right tabs into the new hidden window
    if (rightTabIds.length > 1) {
      await chrome.tabs.move(rightTabIds.slice(1), { windowId: newWindow.id, index: -1 });
    }

    // Save the state so we can restore later
    await setState({
      originalWindowId: windowId,
      hiddenWindowId: newWindow.id,
      hiddenTabIds: rightTabIds
    });

    // Bring focus back to the original window so user isn’t taken away
    await chrome.windows.update(windowId, { focused: true });

  } else {
    // Tabs are currently hidden — restore them back to original window
    try {
     let originalWindow;
      try {
        originalWindow = await chrome.windows.get(originalWindowId);
      } catch {
        console.warn("Original window no longer exists.");
        await clearState();
        return;
      }

      const hiddenWindow = await chrome.windows.get(hiddenWindowId, { populate: true });

      // Move all hidden tabs back to the original window
      await chrome.tabs.move(hiddenTabIds, { windowId: originalWindowId, index: -1 });

      // Close the now empty hidden window
      await chrome.windows.remove(hiddenWindowId);

      // Clear saved state since tabs are restored
      await clearState();

      // Focus original window again
      await chrome.windows.update(originalWindowId, { focused: true });
    } catch (error) {
      console.warn("Something went wrong restoring tabs — clearing state to recover.", error);
      await clearState();
    }
  }

  // Update the menu title to reflect current state
  updateContextMenuTitle();
});

// Also update menu title every time Chrome starts (just in case)
chrome.runtime.onStartup.addListener(() => {
  updateContextMenuTitle();
});
