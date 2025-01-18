console.log("Background script running...");

const backend_endpoint = "https://backend.juncheng03.workers.dev";

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

