console.log("Background script running...");

const backend_endpoint = "http://localhost:8787";

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

        return await crypto.subtle.importKey(
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

async function generateKeypair() {
    try {
        const keypair = await crypto.subtle.generateKey(
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

(async () => {
    let result = await chrome.storage.sync.get([
        'privateKey',
        'publicKey'
    ]);

    let importedprivateKey = await importKeyFromHex(result.privateKey, false);
    let importedpublicKey = await importKeyFromHex(result.publicKey, true);

    if (!(importedprivateKey && importedpublicKey)) {
        const keys = await generateKeypair();

        importedpublicKey = keys.publicKey;
        importedprivateKey = keys.privateKey;

        // Export keys to hex format for display
        const exportedPublic = await crypto.subtle.exportKey("raw", window.cryptoKeys.publicKey);
        const exportedPrivate = await crypto.subtle.exportKey("pkcs8", window.cryptoKeys.privateKey);

        const settings = {
            privateKey: arrayBufferToHex(exportedPrivate),
            publicKey: arrayBufferToHex(exportedPublic),
        };

        chrome.storage.sync.set(settings, () => {
            console.log("Generated new key-value pair");
        });
    }

    result = await chrome.storage.sync.get([
        'privateKey',
        'publicKey'
    ]);

    let user = {
        username: "mao zedong",
        pkey: result.publicKey,
        reputation: 100000000
    };

    console.log("Sending to user endpoint");

    fetch(`${backend_endpoint}/users`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    }).then(() => {
        console.log("User endpoint called");
    });
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'API_REQUEST') {
        let url = `${backend_endpoint}${message.endpoint}`;
        console.log(url)
        // Add the query parameters to the request
        if (message.queryParams) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(message.queryParams)) {
                params.append(key, value);
            }
            url += `?${params.toString()}`;
        }

        const fetchOptions = {
            method: message.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add the request body for POST/PUT requests
        if (message.body && ['POST', 'PUT', 'PATCH'].includes(message.method)) {
            fetchOptions.body = JSON.stringify(message.body);
        }

        fetch(url, fetchOptions)
            .then(response => response.json())
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true;
    }
});

