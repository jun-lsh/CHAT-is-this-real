let originalSettings = {};
let hasUnsavedChanges = false;

// Utility function to get current settings
function getCurrentSettings() {
    return {
        hideMisinformation: document.getElementById('hideMisinformation').checked,
        hideTrigger: document.getElementById('hideTrigger').checked,
        hideSlop: document.getElementById('hideSlop').checked,
        hideEpilepsy: document.getElementById('hideEpilepsy').checked,
        darkMode: document.getElementById('darkModeSwitch').checked
    };
}

// Function to check if settings have changed
function checkForChanges() {
    const currentSettings = getCurrentSettings();

    hasUnsavedChanges = false;
    for (const key in currentSettings) {
        if (currentSettings[key] !== originalSettings[key]) {
            hasUnsavedChanges = true;
            break;
        }
    }

    // Show/hide save button based on changes
    document.getElementById('saveSettings').style.display = hasUnsavedChanges ? 'block' : 'none';
}

// Add event listeners to all inputs
function addChangeListeners() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', checkForChanges);
    });
}

// Generate new keypair
async function generateKeypair() {
    try {
        const keypair = await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            ["sign", "verify"]
        );

        return {
            privateKey: keypair.privateKey,
            publicKey: keypair.publicKey
        };
    } catch (error) {
        console.error('Error generating keypair:', error);
        throw error;
    }
}

// Utility function to convert ArrayBuffer to hex string
function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Utility function to convert hex string to ArrayBuffer
function hexToArrayBuffer(hexString) {
    const pairs = hexString.match(/[\dA-F]{2}/gi);
    if (!pairs) return null;

    const integers = pairs.map(s => parseInt(s, 16));
    return new Uint8Array(integers).buffer;
}

// Import key from hex string
async function importKeyFromHex(hexString, isPublic = true) {
    try {
        const keyData = hexToArrayBuffer(hexString);
        if (!keyData) return null;

        return await window.crypto.subtle.importKey(
            isPublic ? "raw" : "pkcs8",
            keyData,
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            isPublic ? ["verify"] : ["sign"]
        );
    } catch (error) {
        console.error('Error importing key:', error);
        return null;
    }
}

function showModal(title, message) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'block';

    // Close modal handlers
    const closeModal = () => {
        modal.style.display = 'none';
    };

    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal-ok').onclick = closeModal;

    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}


function updateTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// Add event listener for dark mode toggle
document.getElementById('darkModeSwitch').addEventListener('change', function(e) {
    // Immediately update the theme
    updateTheme(e.target.checked);

    // Trigger change detection for the save button
    checkForChanges();
});

// Load existing settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
    chrome.storage.sync.get([
        'privateKey',
        'publicKey',
        'hideMisinformation',
        'hideTrigger',
        'hideSlop',
        'hideEpilepsy',
        'darkMode'
    ], async (result) => {
        // Import stored keys if they exist
        if (result.privateKey && result.publicKey) {
            const importedprivateKey = await importKeyFromHex(result.privateKey, false);
            const importedpublicKey = await importKeyFromHex(result.publicKey, true);

            if (importedprivateKey && importedpublicKey) {
                // Store CryptoKey objects in window for later use
                window.cryptoKeys = {
                    privateKey: importedprivateKey,
                    publicKey: importedpublicKey
                };
            }
        } else {
            const keys = await generateKeypair();

            // Store CryptoKey objects
            window.cryptoKeys = {
                privateKey: keys.privateKey,
                publicKey: keys.privateKey
            };
        }

        console.log(window.cryptoKeys.publicKey);

        // Export keys to hex format for display
        const exportedPublic = await window.crypto.subtle.exportKey("raw", window.cryptoKeys.publicKey);
        const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", window.cryptoKeys.privateKey);

        // Load form values
        document.getElementById('privateKey').value = arrayBufferToHex(exportedPrivate) || '';
        document.getElementById('publicKey').value = arrayBufferToHex(exportedPublic) || '';

        // Load all other settings
        document.getElementById('hideMisinformation').checked = result.hideMisinformation || false;
        document.getElementById('hideTrigger').checked = result.hideTrigger || false;
        document.getElementById('hideSlop').checked = result.hideSlop || false;
        document.getElementById('hideEpilepsy').checked = result.hideEpilepsy || false;

        document.getElementById('darkModeSwitch').checked = result.darkMode || false;
        updateTheme(result.darkMode || false);

        // Store original settings
        originalSettings = getCurrentSettings();

        // Initially hide save button
        document.getElementById('saveSettings').style.display = 'none';

        // Add change listeners
        addChangeListeners();
    });
});

// Regenerate keypair
document.getElementById('regenerateKeys').addEventListener('click', async () => {
    const keys = await generateKeypair();
    // Export keys to hex format for display
    const exportedPublic = await window.crypto.subtle.exportKey("raw", keys.publicKey);
    const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keys.privateKey);

    // Load form values
    document.getElementById('privateKey').value = arrayBufferToHex(exportedPrivate) || '';
    document.getElementById('publicKey').value = arrayBufferToHex(exportedPublic) || '';

    // Store CryptoKey objects
    window.cryptoKeys = {
        privateKey: keys.privateKey,
        publicKey: keys.publicKey
    };

    hasUnsavedChanges = true;
});

// Export keys to file
document.getElementById('exportKeys').addEventListener('click', async () => {
    try {
        // Export current keys to hex format
        const exportedPublic = await window.crypto.subtle.exportKey("raw", window.cryptoKeys.publicKey);
        const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", window.cryptoKeys.privateKey);

        const keyData = {
            privateKey: arrayBufferToHex(exportedPrivate),
            publicKey: arrayBufferToHex(exportedPublic)
        };

        // Create and download file
        const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'identity_file.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting keys:', error);
        alert('Failed to export keys. Please try again.');
    }
});

// Trigger file input when import button is clicked
document.getElementById('importKeys').addEventListener('click', () => {
    document.getElementById('keyFileInput').click();
});

// Handle file import
document.getElementById('keyFileInput').addEventListener('change', async (event) => {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const keyData = JSON.parse(e.target.result);

                // Validate the imported data
                if (!keyData.privateKey || !keyData.publicKey) {
                    showModal('Error', 'Invalid key file format');
                    return;
                }

                // Import the keys
                const privateKey = await window.crypto.subtle.importKey(
                    "pkcs8",
                    hexToArrayBuffer(keyData.privateKey),
                    {
                        name: "ECDSA",
                        namedCurve: "P-256"
                    },
                    true,
                    ["sign"]
                );

                const publicKey = await window.crypto.subtle.importKey(
                    "raw",
                    hexToArrayBuffer(keyData.publicKey),
                    {
                        name: "ECDSA",
                        namedCurve: "P-256"
                    },
                    true,
                    ["verify"]
                );

                // Update the UI
                document.getElementById('privateKey').value = keyData.privateKey;
                document.getElementById('publicKey').value = keyData.publicKey;

                // Update stored keys
                window.cryptoKeys = {
                    privateKey,
                    publicKey
                };

                showModal('Success', 'Keys imported successfully!');
                hasUnsavedChanges = true;
            } catch (error) {
                console.error('Error importing keys:', error);
                showModal('Error', 'Failed to import keys. Please check the file format.');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error reading file:', error);
        showModal('Error', 'Failed to read file. Please try again.');
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
});

// Add beforeunload event listener
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // This shows the browser's default warning message
    }
});

// Modify your save settings event listener
document.getElementById('saveSettings').addEventListener('click', async () => {
    const exportedPublic = await window.crypto.subtle.exportKey("raw", window.cryptoKeys.publicKey);
    const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", window.cryptoKeys.privateKey);

    const settings = {
        privateKey: arrayBufferToHex(exportedPrivate),
        publicKey: arrayBufferToHex(exportedPublic),
        ...getCurrentSettings()
    };

    chrome.storage.sync.set(settings, () => {
        const savedMessage = document.getElementById('savedMessage');
        savedMessage.style.display = 'block';
        setTimeout(() => {
            savedMessage.style.display = 'none';
        }, 2000);

        // Update original settings and hide save button
        originalSettings = getCurrentSettings();
        hasUnsavedChanges = false;
        document.getElementById('saveSettings').style.display = 'none';
    });
});