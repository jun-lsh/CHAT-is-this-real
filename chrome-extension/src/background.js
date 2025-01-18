// console.log("Background script running...");
//
// const backend_endpoint = "https://juncheng.com";

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.type === 'API_REQUEST') {
//         let url = `${backend_endpoint}${message.endpoint}`;
//
//         // Add the query parameters to the request
//         if (message.queryParams) {
//             const params = new URLSearchParams();
//             for (const [key, value] of Object.entries(message.queryParams)) {
//                 params.append(key, value);
//             }
//             url += `?${params.toString()}`;
//         }
//
//         const fetchOptions = {
//             method: message.method,
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         };
//
//         // Add the request body for POST/PUT requests
//         if (message.body && ['POST', 'PUT', 'PATCH'].includes(message.method)) {
//             fetchOptions.body = JSON.stringify(message.body);
//         }
//
//         fetch(url, fetchOptions)
//             .then(response => response.json())
//             .then(data => sendResponse({ success: true, data: data }))
//             .catch(error => sendResponse({ success: false, error: error.message }));
//
//         return true;
//     }
// });

console.log("Background script running...");

const backend_endpoint = "https://juncheng.com";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'API_REQUEST') {
        // Debug: Immediately return half of the IDs without any server request
        if (message.body) {
            const tweetIds = message.body;

            let tweetIdResults = [];
            tweetIds.forEach((v, _) => {
                if (Math.random() > 0.3) {
                    tweetIdResults.push(v);
                }
            })

            console.log("Debug mode: Returning random subset tweet IDs:", tweetIdResults);
            sendResponse({ success: true, data: tweetIdResults });
            return true;
        }

        sendResponse({ success: false, error: "No tweet IDs provided" });
        return true;
    }
});