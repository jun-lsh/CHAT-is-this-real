document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// Load and display current settings
chrome.storage.sync.get(['publicKey'], (result) => {
    const settingsDiv = document.getElementById('currentSettings');
    settingsDiv.textContent = `${result.publicKey.substring(0, 8) + "..." + result.publicKey.substring(result.publicKey.length-9, result.publicKey.length-1)|| 'Not set'}`;
});

chrome.storage.sync.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        
        if(key == window.location.href){
            const count = document.getElementById('counter-value');
            count.textContent = newValue;
        }
        
      console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
      );
    }
  });

// chrome.storage.sync.get([site_key]).then((result) => {
    
//     console.log("Current count for site:", result[site_key]);
// })