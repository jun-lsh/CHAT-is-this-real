document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// Load and display current settings
chrome.storage.sync.get(['publicKey'], (result) => {
    const settingsDiv = document.getElementById('currentSettings');
    settingsDiv.textContent = `Current public key: ${result.publicKey || 'Not set'}`;
});
