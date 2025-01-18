document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// Load and display current settings
chrome.storage.sync.get(['publicKey'], (result) => {
    const settingsDiv = document.getElementById('currentSettings');
    settingsDiv.textContent = `${result.publicKey.substring(0, 8) + "..." + result.publicKey.substring(result.publicKey.length-9, result.publicKey.length-1)|| 'Not set'}`;
});
