

// content.js
// Configuration for the observer
const observerConfig = {
    childList: true, // Watch for children being added or removed
    subtree: true, // Watch all descendants, not just immediate children
    attributes: false, // Don't watch for attribute changes
};

// Keep track of active observers
let activeObservers = [];

function checkIsBad(hash) {
    return true
}

function addReportInfoThumbnail(tweetNode, text) {  
    
    let ytimg = tweetNode?.querySelector("#thumbnail")?.querySelector("yt-image");


    let newsrc = ytimg?.querySelector("img")?.src;

    if (!ytimg?.prepend || !newsrc) {
        setTimeout(() => addReportInfoThumbnail(tweetNode, text), 100);
        return
    }

    img = document.createElement("img")
    img.className =
        "yt-core-image yt-core-image--fill-parent-height yt-core-image--fill-parent-width yt-core-image--content-mode-scale-aspect-fill yt-core-image--loaded";
    
    img.src = newsrc;
    img.style.filter = "blur(10px)"

    let svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );
    svg.setAttribute("width", "32");
    svg.setAttribute("height", "32");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "red");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    svg.setAttribute("absolute", true);
    svg.setAttribute("left", "24px");
    svg.setAttribute("top", "24px");
    

    let path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );
    path.setAttribute(
        "d",
        "M12.356 3.066a1 1 0 0 0-.712 0l-7 2.666A1 1 0 0 0 4 6.68a17.695 17.695 0 0 0 2.022 7.98 17.405 17.405 0 0 0 5.403 6.158 1 1 0 0 0 1.15 0 17.406 17.406 0 0 0 5.402-6.157A17.694 17.694 0 0 0 20 6.68a1 1 0 0 0-.644-.949l-7-2.666Z"
    );
    svg.appendChild(path);

    ytimg.prepend(img);
    ytimg.prepend(svg);
}

function addReportInfo() {
    console.log("addReportInfo");
    let midbar = document.querySelector("#middle-row");

    if (!midbar) {
        setTimeout(addReportInfo, 1000);
        return
    }

    const textBox = document.createElement("div");
    // Style the text box to match Twitter's design
    textBox.style.cssText = `
    padding: 12px;
    margin: 8px 0;
    border: 1px solid rgb(239, 243, 244);
    border-radius: 16px;
    font-size: 15px;
    line-height: 20px;
    color: rgb(83, 100, 113);
    background-color: rgb(247, 249, 249);`;


    midbar.appendChild(textBox);    
    
    textBox.textContent = "MISINFO! !!!";
}

function addMenu() {
    let menubar = document.querySelector(
        "ytd-menu-renderer.style-scope.ytd-watch-metadata"
    );

    if (!menubar) {
        setTimeout(addMenu, 1000);
        return;
    }

    console.log(menubar);

    const button = document.createElement("button");
    // <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    //   <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.5 11.5 11 13l4-3.5M12 20a16.405 16.405 0 0 1-5.092-5.804A16.694 16.694 0 0 1 5 6.666L12 4l7 2.667a16.695 16.695 0 0 1-1.908 7.529A16.406 16.406 0 0 1 12 20Z"/>
    // </svg>

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "32");
    svg.setAttribute("height", "32");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "white");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        "M9.5 11.5 11 13l4-3.5M12 20a16.405 16.405 0 0 1-5.092-5.804A16.694 16.694 0 0 1 5 6.666L12 4l7 2.667a16.695 16.695 0 0 1-1.908 7.529A16.406 16.406 0 0 1 12 20Z"
    );
    svg.appendChild(path);

    button.className = "custom-button";
    // Add styles to head
    const style = document.createElement("style");
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

    button.className = "custom-button";
    button.appendChild(svg);

    const showPopup = createFormPopup({
        hash: document.URL,
        display: document.title
    });
    button.addEventListener("click", showPopup);
    menubar.appendChild(button);
}

// Function to process new tweets
function processTweet(tweetElement) {
    console.log(tweetElement);
    // Check if we've already processed this tweet
    if (tweetElement.dataset.processed) {
        return;
    }

    // Mark the tweet as processed to avoid duplicates
    // tweetElement.dataset.processed = "true";

    // let query_hash = `yt_${tweetElement.querySelector("a").href}`;
    // console.log(query_hash)

    // if (!checkIsBad(query_hash)) return

    try {
        addReportInfoThumbnail(
            tweetElement,
            "^ THIS POST IS 100% NOT MISINFORMATION!! ^"
        );
    } catch {
        return
    }
}

// Function to identify tweet elements
function isTweetElement(element) {
    // Twitter-specific selectors for both timeline and profile tweets
    let res =
        element.tagName == "YTD-COMPACT-VIDEO-RENDERER" ||
        element.tagName == "YTD-RICH-ITEM-RENDERER" ||
        element.tagName == "YTD-VIDEO-RENDERER";

    console.log(res);
    return res;
}

// Callback function for the observer
function handleMutations(mutations) {
    for (const mutation of mutations) {
        // Check added nodes
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
                // Check if the node is an element and matches our tweet criteria
                try {
                    if (isTweetElement(node)) {
                        console.log("MUTATE", node);
                        processTweet(node);
                    }
                } catch {}  
            });
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
    for (let container of document.querySelectorAll('[id="contents"]')) {
        let len = container.querySelectorAll(
            "ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-video-renderer"
        ).length;
        console.log(
            "CONTAINER",
            container,
            len
        );
        if (!len) continue
        
        let observer = new MutationObserver(handleMutations);
        observer.observe(container, observerConfig);
        activeObservers.push(observer);
        console.log("Tweet monitor initialized for", container);

        // Process any existing tweets
        const existingTweets = container.querySelectorAll(
            "ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-video-renderer"
        );
        console.log(existingTweets);
        existingTweets.forEach((tweet) => {
            console.log(existingTweets.tagName);
            if (isTweetElement(tweet)) {
                processTweet(tweet);
            }
        });
    }

    // If no containers found, try again soon
    if (activeObservers.length === 0) {
        setTimeout(initializeObservers, 1000);
    }

    console.log(activeObservers)
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
    initializeObservers();
    addMenu();
    addReportInfo();
    setupURLMonitoring();

    setTimeout(() => {
        initializeObservers();
    }, 500);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    initialize();
}
