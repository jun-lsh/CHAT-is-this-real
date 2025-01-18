// content.js

// Configuration for the observer
const observerConfig = {
    childList: true,     // Watch for children being added or removed
    subtree: true,       // Watch all descendants, not just immediate children
    attributes: true,   // Don't watch for attribute changes
};

// Keep track of active observers
let activeObservers = [];

// Warning messages for different types
const warningMessages = {
    misinformation: 'This post has been identified as containing potential misinformation.',
    trigger: 'This post contains content that may be triggering for some viewers.',
    slop: 'This post has been flagged for potentially misleading or low-quality content.',
    epilepsy: 'This post contains flashing images that may trigger photosensitive epilepsy.'
};

function createWarningElement(type, customMessage = '') {
    // Function to inject CSS
    async function injectStyles() {
        if (!document.getElementById('warning-styles')) {
            try {
                const response = await fetch(chrome.runtime.getURL('src/ingestor/warning.css'));
                const css = await response.text();

                const style = document.createElement('style');
                style.id = 'warning-styles';
                style.textContent = css;
                document.head.appendChild(style);
            } catch (error) {
                console.error('Error loading warning styles:', error);
            }
        }
    }

    // Function to inject HTML
    async function createWarningHTML() {
        try {
            // Load HTML template
            const response = await fetch(chrome.runtime.getURL('src/ingestor/warning.html'));
            const html = await response.text();

            // Create temporary container and insert HTML
            const div = document.createElement('div');
            div.innerHTML = html;

            // Get the warning container
            const warningElement = div.firstElementChild;

            // Add type-specific class
            warningElement.classList.add(`ext-warning-${type}`);

            // Set the warning message
            const description = warningElement.querySelector('.ext-warning-description');
            description.textContent = customMessage || warningMessages[type];

            return warningElement;
        } catch (error) {
            console.error('Error creating warning HTML:', error);
            return null;
        }
    }

    // Return a function that creates the warning element
    return async function() {
        await injectStyles();
        return await createWarningHTML();
    };
}

async function addWarningUnderTweet(tweetNode, warningType, customMessage = '') {
    // Create the warning element
    const createWarning = createWarningElement(warningType, customMessage);
    const warningElement = await createWarning();

    if (warningElement) {
        // Create a container and insert the warning
        const warningContainer = document.createElement('div');
        warningContainer.appendChild(warningElement);

        // Insert after the tweet
        tweetNode.parentNode.insertBefore(warningContainer, tweetNode.nextSibling);

        // Check if dark mode is enabled and apply theme
        chrome.storage.sync.get(['darkMode'], (result) => {
            if (result.darkMode) {
                warningContainer.setAttribute('data-theme', 'dark');
            }
        });
    }
}


function addReportButtonToTweet(buttonNode, tweetInfo){
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
    console.log("Passing in: ", tweetInfo)
    const showPopup = createFormPopup(tweetInfo);
    button.addEventListener("click", showPopup);
    buttonNode.appendChild(button);
}

// Function to process a list of tweets and send the data to the service worker
async function processTweetElements(tweetElementList) {
    let tweetIdList = [];
    let tweetElementMap = new Map();

    for (const tweetElement of tweetElementList) {
        if (isTweetElement(tweetElement)) {
            let result = processTweet(tweetElement);
            if (result) {
                console.log(result)

                var buttonDiv = tweetElement.querySelector('[data-testid="caret"]')
                var retries = 0
                // while(!buttonDiv){
                //     await new Promise(resolve => setTimeout(resolve, 500));
                //     retries++
                //     if (retries > 5) break
                // }
                for(var _ = 0; _ < 4; _++) {
                    buttonDiv = buttonDiv.parentNode;
                }
                addReportButtonToTweet(buttonDiv, result);
                tweetElement.dataset.processed = 'true';
                tweetIdList.push(result.statusId);
                tweetElementMap.set(result.statusId,
                    {
                        element:tweetElement,
                        info: result
                    }
                );

                await addWarningUnderTweet(tweetElement, 'misinformation');
            }
        }
    }

    console.log(`Processed tweet elements: ${tweetIdList.length}`)

    // if (tweetIdList.length > 0) {
    //     // send a message to the service worker containing a list of all the tweets you want to check
    //     const response = await apiRequestServiceWorker('POST', '/validate', {site: "twitter"}, tweetIdList);
    //     if (response && response.data) {
    //         // response.data is an array of tweet IDs that matched
    //         const matchedIds = new Set(response.data);
    //
    //         matchedIds.forEach((tweetId, _) => {
    //             if (tweetElementMap.has(tweetId)) {
    //                 const warningType = response.data.find(item => item.id === tweetId).type || 'misinformation';
    //                 addWarningUnderTweet(tweetElementMap.get(tweetId).element, warningType);
    //             }
    //         });
    //     }
    // }
}

// Function to process new tweets
function processTweet(tweetElement) {
    // Check if we've already processed this tweet
    if (tweetElement.dataset.processed) {
        return;
    }

    // Mark the tweet as processed to avoid duplicates
    

    // Extract username (handle)
    const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"] a');
    const username = usernameElement ? usernameElement.textContent.trim() : null;

    // Extract timestamp and status ID from the tweet link
    const timestampElement = tweetElement.querySelector('time');
    const timestamp = timestampElement ? timestampElement.getAttribute('datetime') : null;

    // Get status ID from the tweet URL
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    const statusId = tweetLink ? tweetLink.href.match(/\/status\/(\d+)/)?.[1] : null;

    const tweetInfo = {
        username: username,
        timestamp: timestamp,
        site: "tw",
        statusId: statusId,
        hashVal: tweetLink ? tweetLink.href : null
    };

    // Log the extracted data
    // console.log('New tweet detected:', tweetInfo);

    return tweetInfo;
}

// Function to identify tweet elements
function isTweetElement(element) {
    // Twitter-specific selectors for both timeline and profile tweets
    return (
        element.tagName === 'ARTICLE' &&
        (element.closest('[data-testid="primaryColumn"]') || 
         element.closest('[data-testid="UserProfileTimeline"]'))
    );
}

// Callback function for the observer
function handleMutations(mutations) {
    for (const mutation of mutations) {
        // Check added nodes
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            let nodesToCheck = [];

            mutation.addedNodes.forEach(node => {
                // Check if the node is an element and matches our tweet criteria
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // If the node itself is a tweet
                    nodesToCheck.push(node);
                    
                    // Check children for tweets (in case tweets are nested in added containers)
                    const tweetElements = node.querySelectorAll('article');
                    tweetElements.forEach(tweetElement => {
                        nodesToCheck.push(tweetElement);
                    });
                }
            });

            processTweetElements(nodesToCheck).then(r => {
                console.log(`tweets checked ${nodesToCheck.length}`);
            });
        }
    }
}

// Clean up existing observers
function cleanupObservers() {
    activeObservers.forEach(observer => observer.disconnect());
    activeObservers = [];
}

// Initialize observers for containers
async function initializeObservers() {
    const selectors = [
        '[data-testid="primaryColumn"]',
        '[data-testid="UserProfileTimeline"]'
    ];
    
    cleanupObservers();
    await new Promise(resolve => setTimeout(resolve, 1500)); // fuck you
    selectors.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            const observer = new MutationObserver(handleMutations);
            observer.observe(container, observerConfig);
            activeObservers.push(observer);
            console.log(`Tweet monitor initialized for ${selector}`);
            
            // Process any existing tweets
            const existingTweets = container.querySelectorAll('article');
            processTweetElements(existingTweets).then(r => {
                console.log(`existing tweets checked ${existingTweets.length}`);
            });
        }
    });
    
    // If no containers found, try again soon
    if (activeObservers.length === 0) {
        setTimeout(initializeObservers, 1000);
    }
}

// Monitor for URL changes
function setupURLMonitoring() {
    let lastUrl = location.href;
    
    // Create an observer instance to watch for URL changes
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('URL changed, reinitializing tweet monitors...');
            // Wait a bit for the new page content to load
            setTimeout(initializeObservers, 1000);
        }
    });

    // Start observing the document with the configured parameters
    urlObserver.observe(document, { 
        subtree: true, 
        childList: true 
    });
}

// Initialize when the page is ready
function initialize() {
    initializeObservers();
    setupURLMonitoring();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}