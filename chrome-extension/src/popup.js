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
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentUrl = tabs[0].url;
            // Now you can use currentUrl as needed
            console.log(currentUrl);

            if(key === currentUrl){
                const count = document.querySelector('.counter-value');
                if (count) {
                    count.textContent = newValue;
                } else {
                    console.warn('Counter element not found in DOM');
                }
            }
        });
        
      console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
      );
    }
  });

// chrome.storage.sync.get([site_key]).then((result) => {
    
//     console.log("Current count for site:", result[site_key]);
// })