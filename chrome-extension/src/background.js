console.log("Background script running...");

// This is an example of sending a message using a persistent
// connection, between the service worker and the content script
chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name === "knockknock");
    port.onMessage.addListener(function(msg) {
        console.log(`Service worker received message: ${JSON.stringify(msg)}`);

        if (msg.joke === "Knock knock")
            port.postMessage({question: "Who's there?"});
        else if (msg.answer === "Madame")
            port.postMessage({question: "Madame who?"});
        else if (msg.answer === "Madame... Bovary")
            port.postMessage({question: "I don't get it."});
    });
});

// This is an example of once-off message sending between the
// content script and the service worker
(async () => {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    console.log(`Sending a message to: ${JSON.stringify(tab)}`);

    const response = await chrome.tabs.sendMessage(tab.id, {greeting: "hello"});
    // do something with response here, not outside the function
    console.log(`One time message response: ${JSON.stringify(response)}`);
})();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.greeting === "hello")
            sendResponse({farewell: "goodbye"});
    }
);