// content.js

// Configuration for the observer
const observerConfig = {
    childList: true,     // Watch for children being added or removed
    subtree: true,       // Watch all descendants, not just immediate children
    attributes: false,   // Don't watch for attribute changes
};

// Keep track of active observers
let activeObservers = [];

function addTextBoxUnderTweet(tweetNode, text) {
    console.log("Called addTextBoxUnderTweet")
    // Create a new div for our text box

    const textBox = document.createElement('div');
    const tweetId = Math.random().toString(36).substring(7);
    textBox.id = `tweet-box-${tweetId}`;
    console.log(textBox.id)
    // Style the text box to match Twitter's design
    textBox.style.cssText = `
        padding: 12px;
        margin: 8px 0;
        border: 1px solid rgb(239, 243, 244);
        border-radius: 16px;
        font-size: 15px;
        line-height: 20px;
        color: rgb(83, 100, 113);
        background-color: rgb(247, 249, 249);
    `;
    
    // Add the text content
    textBox.textContent = text;
    
    tweetNode.parentNode.insertBefore(textBox, tweetNode.parentNode.nextSibling);
}

// Function to process new tweets
function processTweet(tweetElement) {
    // Check if we've already processed this tweet
    if (tweetElement.dataset.processed) {
        return;
    }

    // Mark the tweet as processed to avoid duplicates
    tweetElement.dataset.processed = 'true';

    // Extract username (handle)
    const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"] a');
    const username = usernameElement ? usernameElement.textContent.trim() : null;

    // Extract timestamp and status ID from the tweet link
    const timestampElement = tweetElement.querySelector('time');
    const timestamp = timestampElement ? timestampElement.getAttribute('datetime') : null;

    // Get status ID from the tweet URL
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    const statusId = tweetLink ? tweetLink.href.match(/\/status\/(\d+)/)?.[1] : null;

    // Log the extracted data
    console.log('New tweet detected:', {
        username,
        timestamp,
        statusId,
        url: tweetLink ? tweetLink.href : null
    });

    addTextBoxUnderTweet(tweetElement, '^ THIS POST IS 100% NOT MISINFORMATION!! ^');
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
            mutation.addedNodes.forEach(node => {
                // Check if the node is an element and matches our tweet criteria
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // If the node itself is a tweet
                    if (isTweetElement(node)) {
                        processTweet(node);
                    }
                    
                    // Check children for tweets (in case tweets are nested in added containers)
                    const tweetElements = node.querySelectorAll('article');
                    tweetElements.forEach(tweetElement => {
                        if (isTweetElement(tweetElement)) {
                            processTweet(tweetElement);
                        }
                    });
                }
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
function initializeObservers() {
    const selectors = [
        '[data-testid="primaryColumn"]',
        '[data-testid="UserProfileTimeline"]'
    ];
    
    cleanupObservers();
    
    selectors.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            const observer = new MutationObserver(handleMutations);
            observer.observe(container, observerConfig);
            activeObservers.push(observer);
            console.log(`Tweet monitor initialized for ${selector}`);
            
            // Process any existing tweets
            const existingTweets = container.querySelectorAll('article');
            existingTweets.forEach(tweet => {
                if (isTweetElement(tweet)) {
                    processTweet(tweet);
                }
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