console.log("youtube");

// This is an example of sending a message using a persistent
// connection, between the service worker and the content script
var port = chrome.runtime.connect({name: "knockknock"});
port.postMessage({joke: "Knock knock"});

port.onMessage.addListener(function(msg) {
    console.log(`Content script received message: ${JSON.stringify(msg)}`);

    if (msg.question === "Who's there?")
        port.postMessage({answer: "Madame"});
    else if (msg.question === "Madame who?")
        port.postMessage({answer: "Madame... Bovary"});
});


// This is an example of once-off message sending between the
// content script and the service worker
(async () => {
    const response = await chrome.runtime.sendMessage({greeting: "hello"});

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