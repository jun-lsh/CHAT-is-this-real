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
    // if(tweetNode.parentNode.childNodes.first == tweetNode){console.log("first kid")}
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
    
    for(var _ = 0; _ < 11; _++) {
        // console.log(_)
        // if(curr.childNodes.length == 0){
        //     console.log(curr)
        // }
        curr = curr.childNodes[0]
    }
    if(curr.childNodes.length > 1) return
    curr.appendChild(textBox);

}

function addReportButtonToTweet(tweetNode, tweetInfo){
    const button = document.createElement("button");
    // <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    //   <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.5 11.5 11 13l4-3.5M12 20a16.405 16.405 0 0 1-5.092-5.804A16.694 16.694 0 0 1 5 6.666L12 4l7 2.667a16.695 16.695 0 0 1-1.908 7.529A16.406 16.406 0 0 1 12 20Z"/>
    // </svg>
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M9.5 11.5 11 13l4-3.5M12 20a16.405 16.405 0 0 1-5.092-5.804A16.694 16.694 0 0 1 5 6.666L12 4l7 2.667a16.695 16.695 0 0 1-1.908 7.529A16.406 16.406 0 0 1 12 20Z");
    svg.appendChild(path);

    button.className = 'custom-button';
    // Add styles to head
    const style = document.createElement('style');
    style.textContent = `
      .custom-button {
        display: inline-flex;
        align-items: center;
        border: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      }
      
      .custom-button::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        width: 24px;
        height: 24px;
        padding: 8px;
        border-radius: 50%;
        background-color: rgba(255, 0, 0, 0.1);
        transition: transform 0.2s ease;
      }
      
      .custom-button:hover::before {
        transform: translate(-50%, -50%) scale(1);
      }
    `;
    document.head.appendChild(style);
    
    button.className = 'custom-button';
    button.appendChild(svg);

    const showPopup = createFormPopup(tweetInfo);
    button.addEventListener("click", showPopup);


    var curr = tweetNode.childNodes[0]
    
    for(var _ = 0; _ < 12; _++) {
        // console.log(_)
        // if(curr.childNodes.length == 0){
        //     console.log(curr)
        // }
        curr = curr.childNodes[0]
    }

    curr = curr.childNodes[12].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
    if(curr.childNodes.length > 4) return

    // const buttonContainer = document.createElement('div');
    // buttonContainer.
    curr.appendChild(button);
    // buttonNode
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
        console.log("came widdit")
        var event = new FocusEvent('focusin', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        });

        targetAnchor.dispatchEvent(event);
        console.log(targetAnchor)
        await new Promise(resolve => setTimeout(resolve, 200));
        addTextBoxUnderTweet(
            tweetElement,
            "^ THIS POST IS 100% NOT MISINFORMATION!! ^"
        );
        addReportButtonToTweet(tweetElement, {})
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
                        if(!targetAnchor.getAttribute('href').includes("l.facebook.com")){
                            addTextBoxUnderTweet(
                                tweetElement,
                                "^ THIS POST IS 100% NOT MISINFORMATION!! ^"
                            );
                            addReportButtonToTweet(tweetElement, {})
                            observer.disconnect();
                        }
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
