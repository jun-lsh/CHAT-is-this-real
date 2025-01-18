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

// Load existing settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
    chrome.storage.sync.get([
        'privateKey',
        'publicKey',
        'exampleDropdown',
        'exampleSwitch',
        'showDropdownSwitch',
        'optionalDropdown',
        'darkMode'
    ], async (result) => {
        // Import stored keys if they exist
        if (result.privateKey && result.publicKey) {
            window.cryptoKeys = {
                privateKey: result.privateKey,
                publicKey: result.publicKey
            };
        } else {
            const keys = await generateKeypair();
            document.getElementById('privateKey').value = keys.privateKey;
            document.getElementById('publicKey').value = keys.publicKey;

            // Store CryptoKey objects
            window.cryptoKeys = {
                privateKey: keys.privateKey,
                publicKey: keys.privateKey
            };
        }

        // Export keys to hex format for display
        const exportedPublic = await window.crypto.subtle.exportKey("raw", window.cryptoKeys.publicKey);
        const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", window.cryptoKeys.privateKey);

        // Load form values
        document.getElementById('privateKey').value = arrayBufferToHex(exportedPrivate) || '';
        document.getElementById('publicKey').value = arrayBufferToHex(exportedPublic) || '';

        document.getElementById('exampleDropdown').value = result.exampleDropdown || 'option1';
        document.getElementById('exampleSwitch').checked = result.exampleSwitch || false;
        document.getElementById('showDropdownSwitch').checked = result.showDropdownSwitch || false;
        document.getElementById('optionalDropdown').value = result.optionalDropdown || 'opt1';
        document.getElementById('optionalDropdownContainer').style.display =
            result.showDropdownSwitch ? 'block' : 'none';
        document.getElementById('darkModeSwitch').checked = result.darkMode || false;
        document.documentElement.setAttribute('data-theme', result.darkMode ? 'dark' : 'light');
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
                    throw new Error('Invalid key file format');
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

                alert('Keys imported successfully!');
            } catch (error) {
                console.error('Error importing keys:', error);
                alert('Failed to import keys. Please check the file format.');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error reading file:', error);
        alert('Failed to read file. Please try again.');
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
    const settings = {
        privateKey: window.cryptoKeys.privateKey,
        publicKey: window.cryptoKeys.publicKey,
        exampleDropdown: document.getElementById('exampleDropdown').value,
        exampleSwitch: document.getElementById('exampleSwitch').checked,
        showDropdownSwitch: document.getElementById('showDropdownSwitch').checked,
        optionalDropdown: document.getElementById('optionalDropdown').value,
        darkMode: document.getElementById('darkModeSwitch').checked
    };

    chrome.storage.sync.set(settings, () => {
        const savedMessage = document.getElementById('savedMessage');
        savedMessage.style.display = 'block';
        setTimeout(() => {
            savedMessage.style.display = 'none';
        }, 2000);
    });
});