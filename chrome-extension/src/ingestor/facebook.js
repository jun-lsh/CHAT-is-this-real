// content.js

// Configuration for the observer
const observerConfig = {
    childList: true, // Watch for children being added or removed
    subtree: true, // Watch all descendants, not just immediate children
    attributes: false, // Don't watch for attribute changes
};

// Keep track of active observers
let activeObservers = [];

function addTextBoxUnderTweet(tweetNode, text) {
    // console.log("Called addTextBoxUnderTweet");
    // Create a new div for our text box

    const textBox = document.createElement("div");
    const tweetId = Math.random().toString(36).substring(7);
    textBox.id = `tweet-box-${tweetId}`;
    // console.log(textBox.id);
    // Style the text box to match Twitter's design
    textBox.style.cssText = `
        padding: 12px;
        margin: 8px;
        border: 1px solid rgb(239, 243, 244);
        border-radius: 16px;
        font-size: 15px;
        line-height: 20px;
        color: rgb(83, 100, 113);
        background-color: rgb(247, 249, 249);
    `;

    // Add the text content
    textBox.textContent = text;
    var curr = tweetNode.childNodes[0]
    // border-radius: max(0px, min(var(--card-corner-radius), calc((100vw - 4px - 100%) * 9999))) / var(--card-corner-radius);

    // for(var _ = 0; _ < 20; _++) {
    //     curr = curr.childNodes[0]
    //     //                                 max(0px, min(var(--card-corner-radius), calc((100vw - 4px - 100%) * 9999))) / var(--card-corner-radius);
    //     if(curr.style['borderRadius'] === "max(0px, min(var(--card-corner-radius), calc((100vw - 4px - 100%) * 9999))) / var(--card-corner-radius)"){
    //         console.log(curr.style['borderRadius'])
    //         break;
    //     }
    // }
    curr.appendChild(textBox);

}

// Function to process new tweets
async function processTweet(tweetElement) {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 1000;

    const findTargetAnchor = () => Array.from(tweetElement.getElementsByTagName('a')).find(a =>
        a.hasAttribute('attributionsrc') &&
        a.classList.contains('x1i10hfl') &&
        a.getAttribute('role') === 'link' &&
        a.getAttribute('target') === '_blank'
    );

    var targetAnchor = findTargetAnchor();
    if (targetAnchor) {
        console.log(targetAnchor)
        var event = new FocusEvent('focusin', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        });

        targetAnchor.dispatchEvent(event);
        addTextBoxUnderTweet(
            tweetElement,
            "^ THIS POST IS 100% NOT MISINFORMATION!! ^"
        );
    } else {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // console.log(mutation.type);
                if (mutation.type != "childList") {
                    targetAnchor = findTargetAnchor()
                    // console.log(tweetElement, targetAnchor)
                    if (targetAnchor) {
                        var event = new FocusEvent('focusin', {
                            'view': window,
                            'bubbles': true,
                            'cancelable': true
                        });

                        targetAnchor.dispatchEvent(event);
                        console.log(targetAnchor)
                        addTextBoxUnderTweet(
                            tweetElement,
                            "^ THIS POST IS 100% NOT MISINFORMATION!! ^"
                        );
                        observer.disconnect();
                    }
                }
            });
        });

        if (targetAnchor) observer.disconnect()
        //   while (!targetAnchor && retryCount < MAX_RETRIES) {
        //     if (!targetAnchor) {
        //       console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES}: Anchor not found, retrying in ${RETRY_DELAY}ms...`);
        //       await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        //       retryCount++;
        //     }
        //   }
        //   observer.disconnect()
        // configuration of the observer:
        var config = { attributes: true, childList: true, characterData: true, subtree: true };

        // pass in the target node, as well as the observer options
        observer.observe(tweetElement, config);

    }
}

// Function to identify tweet elements
function isTweetElement(element) {
    // Twitter-specific selectors for both timeline and profile tweets
    return element.matches('[class="x1lliihq"]');
}

// Callback function for the observer
function handleMutations(mutations) {
    for (const mutation of mutations) {
        // Check added nodes
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
                // Check if the node is an element and matches our tweet criteria
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // If the node itself is a tweet
                    if (isTweetElement(node)) {
                        processTweet(node);
                    }

                    // Check children for tweets (in case tweets are nested in added containers)
                    const tweetElements = node.querySelectorAll("[class='x1lliihq']");
                    tweetElements.forEach((tweetElement) => {
                        if (isTweetElement(tweetElement)) {
                            processTweet(tweetElement);
                        }
                    });
                }
            });
        }

        if (mutation.removedNodes && mutation.removedNodes.length > 0) {
            var target = mutation.target
            if (target.nodeType == Node.ELEMENT_NODE) {
                if (isTweetElement(target)) {
                    target.parentNode.removeChild(target)
                }
            }
        }

    }
}

// Clean up existing observers
function cleanupObservers() {
    activeObservers.forEach((observer) => observer.disconnect());
    activeObservers = [];
}

// Initialize observers for containers
function initializeObservers() {
    let elem = document.querySelectorAll("[class='x1lliihq']")[0];
    console.log(elem);

    if (elem) {
        const container = elem.parentNode;
        console.log(container)
        if (container) {
            console.log("ok")
            const observer = new MutationObserver(handleMutations);
            observer.observe(container, observerConfig);
            activeObservers.push(observer);
            console.log(`Tweet monitor initialized for ${container}`);

            // Process any existing tweets
            const existingTweets = container.querySelectorAll("[class='x1lliihq']");
            existingTweets.forEach((tweet) => {
                if (isTweetElement(tweet)) {
                    processTweet(tweet);
                }
            });

            return
        }
    }



    setTimeout(initializeObservers, 1000);
}

// Monitor for URL changes
function setupURLMonitoring() {
    let lastUrl = location.href;

    // Create an observer instance to watch for URL changes
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log("URL changed, reinitializing tweet monitors...");
            // Wait a bit for the new page content to load
            setTimeout(initializeObservers, 1000);
        }
    });

    // Start observing the document with the configured parameters
    urlObserver.observe(document, {
        subtree: true,
        childList: true,
    });
}

// Initialize when the page is ready
function initialize() {
    console.log("started")
    initializeObservers();
    setupURLMonitoring();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    initialize();
}
