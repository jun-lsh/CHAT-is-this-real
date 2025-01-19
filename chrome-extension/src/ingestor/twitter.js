// content.js

// Configuration for the observer
const observerConfig = {
    childList: true,     // Watch for children being added or removed
    subtree: true,       // Watch all descendants, not just immediate children
    attributes: true,   // Don't watch for attribute changes
};

// Global variable to track filtered count between updates
let globalFilteredCount = 0;

// Function to update the filtered count
function updateFilteredCount(additionalCount = 0) {
    globalFilteredCount += additionalCount;
    const site_key = window.location.href;

    // Update storage with accumulated count
    chrome.storage.sync.get([site_key]).then((result) => {
        console.log("Current count for site:", result[site_key]);

        let dataobj = {};
        if (result[site_key]) {
            dataobj[site_key] = result[site_key] + globalFilteredCount;
        } else {
            dataobj[site_key] = globalFilteredCount;
        }

        chrome.storage.sync.set(dataobj).then(() => {
            console.log("Updated filtered count in storage:", dataobj[site_key]);
            // Reset global counter after successful update
            globalFilteredCount = 0;
        }).catch((error) => {
            console.error("Error updating filtered count:", error);
        });
    }).catch((error) => {
        console.error("Error reading current count:", error);
    });
}

// Function to start periodic updates
function startPeriodicUpdates(intervalInMs = 1000) { // Default 30 seconds
    // Initial update
    updateFilteredCount();

    // Set up periodic updates
    return setInterval(() => {
        updateFilteredCount();
    }, intervalInMs);
}

// Function to stop periodic updates
function stopPeriodicUpdates(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        // Final update to ensure no counts are lost
        updateFilteredCount();
    }
}

// Keep track of active observers
let activeObservers = [];

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
            }
        }
    }

    console.log(`Processed tweet elements: ${tweetIdList.length}`)

    let filtered_count = 0;

    if (tweetElementMap.length > 0) {
        // For every tweet in the list, query the server for a list of reports concerning the tweet
        let types = ["misinformation", "trigger", "slop", "epilepsy"];
        let threshold_votes = 5;
        let remove_threshold = 8.0;

        let prefs = await getContentPreferences();

        for (id in tweetElementMap.keys()) {
            let tweetinfo = tweetElementMap.get(id);

            const digestBuffer = await digestMessage(tweetinfo.info["hashVal"]);
            let hash = tweetinfo.info["site"] + "_" + digestBuffer;
            let response = await apiRequestServiceWorker('GET', '/reports/' + hash);

            if (response && response.data) {
                let max_ratio = [0.0, 0.0, 0.0, 0.0];
                let upvotes = [0, 0, 0, 0];

                let category_text = ["", "", "", ""];

                response.data.forEach((reports, _) => {
                    for (let i = 0;i < types.length;i++) {
                        if (reports.report_type === types[i]) {
                            upvotes[i] += reports.upvote;

                            if ((reports.upvote + reports.downvote) > threshold_votes) {
                                max_ratio[i] = Math.max(reports.upvote / (reports.downvote + reports.upvote), max_ratio[i]);
                                category_text[i] = reports.report_text;
                            }
                        }
                    }
                });

                if ((prefs.misinformation && max_ratio[0] > remove_threshold)
                    || (prefs.trigger && max_ratio[1] > remove_threshold)
                    || (prefs.slop && max_ratio[2] > remove_threshold)
                    || (prefs.epilepsy && max_ratio[3] > remove_threshold)
                ) {
                    // hide post
                    filtered_count += 1;

                    tweetinfo.element.parentNode.removeChild(tweetinfo.element);
                } else {
                    let flag_category = "none";
                    let flag_text = "";
                    let max_upvotes = 0;
                    for (let i = 0;i < types.length;i++) {
                        if (max_ratio[i] > remove_threshold) {
                            if (upvotes[i] > max_upvotes) {
                                max_upvotes = upvotes[i];
                                flag_category = types[i];
                                flag_text = category_text[i];
                            }
                        }
                    }

                    if (flag_category !== "none") {
                        await addWarningUnderTweet(tweetElementMap.get(tweetId).element, flag_category, flag_text);
                    }
                }
            }
        }
    }

    let site_key = window.location.href;

    if (filtered_count > 0) {
        updateFilteredCount(filtered_count);
    }
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
    await new Promise(resolve => setTimeout(resolve, 2500)); // fuck you
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

// Initialize periodic updates when the extension loads
let updateIntervalId;

function initializeCountUpdates() {
    // Start periodic updates every 30 seconds
    updateIntervalId = startPeriodicUpdates(1000);

    // Add cleanup on window unload
    window.addEventListener('unload', () => {
        stopPeriodicUpdates(updateIntervalId);
    });
}

// Initialize when the page is ready
function initialize() {
    initializeObservers();
    setupURLMonitoring();
    initializeCountUpdates();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}