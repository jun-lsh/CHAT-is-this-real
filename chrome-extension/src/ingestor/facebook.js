// content.js

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

// Configuration for the observer
const observerConfig = {
    childList: true, // Watch for children being added or removed
    subtree: true, // Watch all descendants, not just immediate children
    attributes: false, // Don't watch for attribute changes
};

// Keep track of active observers
let activeObservers = [];

async function addTextBoxUnderTweet(tweetNode, warningType, customMessage = '', offset = false) {

    var curr = null;

    if (!offset) {
        curr = tweetNode.childNodes[0]
        for (var _ = 0; _ < 11; _++) {

            if (curr.childNodes.length == 1) curr = curr.childNodes[0]
            else curr = curr.childNodes[1]
        }
        if (curr.childNodes.length > 1) return
        // curr.appendChild(textBox);
    } else {
        curr = tweetNode.childNodes[0]
        for (var _ = 0; _ < 8; _++) {
            curr = curr.childNodes[0]
        }
        console.log(curr)
        if (curr.childNodes.length > 1) return
        // curr.appendChild(textBox);
    }

    const createWarning = createWarningElement(warningType, customMessage);
    const warningElement = await createWarning();

    if (warningElement) {
        // Create a container and insert the warning
        const warningContainer = document.createElement('div');
        warningContainer.appendChild(warningElement);

        // Insert after the tweet
        if (curr.childNodes.length > 1) return
        curr.appendChild(warningContainer, tweetNode.nextSibling);

        // Check if dark mode is enabled and apply theme
        chrome.storage.sync.get(['darkMode'], (result) => {
            if (result.darkMode) {
                warningContainer.setAttribute('data-theme', 'dark');
            }
        });
    }

}

async function addReportButtonToTweet(tweetNode, tweetInfo, offset = false) {
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
        position: absolute;
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
    console.log("Info", tweetInfo)
    const showPopup = createFormPopup(tweetInfo);
    button.addEventListener("click", showPopup);


    var curr = tweetNode.childNodes[0]

    if (!offset) {
        for (var _ = 0; _ < 12; _++) {
            // console.log(_)
            // if(curr.childNodes.length == 0){
            //     console.log(curr)
            // }
            if (curr.childNodes.length != 1 && _ == 1) curr = curr.childNodes[1]
            else curr = curr.childNodes[0]
            // curr = curr.childNodes[0]
        }

        curr = curr.childNodes[12].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
        if (curr.childNodes.length > 4) return
    } else {
        for (var _ = 0; _ < 9; _++) {
            curr = curr.childNodes[0]
        }
        console.log(curr)
        curr = curr.childNodes[12].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
        if (curr.childNodes.length > 3) return
    }

    let buttonContainer = document.createElement('div');

    buttonContainer.style.width = "36px";
    buttonContainer.style.height = "36px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.alignItems = "center";

    buttonContainer.appendChild(button);
    // await new Promise(resolve => setTimeout(resolve, 1500));
    // if (curr.childNodes.length > 4) return
    curr.appendChild(buttonContainer);
    // buttonNode
}

function postDetails(href) {
    // Pattern matchers for different URL types
    const patterns = {
        posts: /\/posts\/([^?]+)/,
        video: /watch\/\?v=([^&]+)/,
        groupWithUser: /groups\/([^\/]+)\/user\/([^\/]+)/,
        groupWithPermalink: /groups\/([^\/\?]+).*?multi_permalinks=([^&]+)/,
        permalink: /story_fbid=([^&]+).*?&id=([^&]+)/
    };

    // Check URL type and extract accordingly
    let type, username, postId;

    if (href.includes('/posts/')) {
        type = 'posts';
        username = href.match(/facebook\.com\/([^\/]+)/)[1];
        postId = href.match(patterns.posts)[1];
    }
    else if (href.includes('/watch/')) {
        type = 'watch';
        username = href.match(/facebook\.com\/([^\/]+)/)[1];
        postId = href.match(patterns.video)[1];
    }
    else if (href.includes('/groups/')) {
        type = 'groups';
        if (href.includes('/user/')) {
            const matches = href.match(patterns.groupWithUser);
            postId = matches[1];    // group id
            username = matches[2];   // user id
        } else {
            const matches = href.match(patterns.groupWithPermalink);
            username = matches[1];   // group id
            postId = matches[2];     // multi_permalinks value
        }
    }
    else if (href.includes('permalink.php')) {
        type = 'permalink';
        const matches = href.match(patterns.permalink);
        postId = matches[1];    // story_fbid
        username = matches[2];   // id
    }

    return {
        type,
        username,
        postId,
        site: "fb",
        hashVal: username + postId
    };
}

// Function to process new tweets
async function processTweet(tweetElement, offset = false) {
    let tweetIdList = [];
    let tweetElementMap = new Map();
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 1000;

    const findTargetAnchor = () => Array.from(tweetElement.getElementsByTagName('a')).find(a =>
        a.hasAttribute('attributionsrc') &&
        a.classList.contains('x1i10hfl') &&
        a.getAttribute('role') === 'link' &&
        (a.getAttribute('target') === '_blank')
    );

    const findTargetAnchor2 = () => Array.from(tweetElement.getElementsByTagName('a')).find(a =>
        a.hasAttribute('attributionsrc') &&
        a.classList.contains('x1i10hfl') &&
        a.getAttribute('role') === 'link'
        && a.getAttribute('href').includes("posts")
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

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(async function (mutation) {
                if (mutation.type === "attributes") {
                    console.log("attributes changed");
                    console.log(mutation.target.getAttribute('href'))
                    var deets = postDetails(mutation.target.getAttribute('href'))
                    if (deets) {
                        observer.disconnect()
                        console.log("Printing", deets)
                        addReportButtonToTweet(tweetElement, deets, offset)
                        // await addTextBoxUnderTweet(
                        //     tweetElement,
                        //     "misinformation",
                        //     "",
                        //     offset
                        // );
                        tweetElement.dataset.processed = 'true';
                        tweetIdList.push(deets.hashVal);
                        tweetElementMap.set(deets.hashVal,
                            {
                                element: tweetElement,
                                info: deets
                            }
                        );
                    }
                }

                //   console.log(mutation.target);
            });
        });

        observer.observe(targetAnchor, {
            attributes: true //configure it to listen to attribute changes
        });

        // console.log(targetAnchor.parentNode.childNodes[0].getAttribute('href'))
        // targetAnchor = findTargetAnchor2()

        // await new Promise(resolve => setTimeout(resolve, 200));

    } else {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(async function (mutation) {
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
                        // console.log(targetAnchor)
                        // if (!targetAnchor.getAttribute('href').includes("l.facebook.com")) {
                        //     addTextBoxUnderTweet(
                        //         tweetElement,
                        //         "^ THIS POST IS 100% NOT MISINFORMATION!! ^",
                        //         offset
                        //     );
                        //     addReportButtonToTweet(tweetElement, postDetails(targetAnchor.getAttribute('href')), offset)
                        //     observer.disconnect();
                        // }
                        var observer2 = new MutationObserver(function (mutations) {
                            mutations.forEach(async function (mutation) {
                                if (mutation.type === "attributes") {
                                    console.log("attributes changed");
                                    console.log(mutation.target.getAttribute('href'))
                                    var deets = postDetails(mutation.target.getAttribute('href'))
                                    if (deets) {
                                        observer.disconnect()
                                        console.log(deets)
                                        addReportButtonToTweet(tweetElement, deets, offset)
                                        // await addTextBoxUnderTweet(
                                        //     tweetElement,
                                        //     "misinformation",
                                        //     "",
                                        //     offset
                                        // );
                                        tweetElement.dataset.processed = 'true';
                                        tweetIdList.push(deets.hashVal);
                                        tweetElementMap.set(deets.hashVal,
                                            {
                                                element: tweetElement,
                                                info: deets
                                            }
                                        );
                                    }
                                }

                                //   console.log(mutation.target);
                            });
                        });

                        observer2.observe(targetAnchor, {
                            attributes: true //configure it to listen to attribute changes
                        });
                    }
                }
            });
        });

        if (targetAnchor) observer.disconnect()
        var config = { attributes: true, childList: true, characterData: true, subtree: true };

        // pass in the target node, as well as the observer options
        observer.observe(tweetElement, config);

    }

    let filtered_count = 0;

    if (tweetElementMap.size > 0) {
        // For every tweet in the list, query the server for a list of reports concerning the tweet
        let types = ["misinformation", "trigger", "slop", "epilepsy"];
        let threshold_votes = 5;
        let remove_threshold = 0.6;

        let prefs = await getContentPreferences();

        for (id of tweetElementMap.keys()) {
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
                        // await addWarningUnderTweet(tweetElementMap.get(tweetId).element, flag_category);
                        await addTextBoxUnderTweet(
                            tweetElementMap.get(tweetId).element,
                            flag_category,
                            flag_text,
                            offset
                        );
                    }
                }
            }
        }
    }

    if (filtered_count > 0) {
        updateFilteredCount(filtered_count);
    }
}

// Function to identify tweet elements
function isTweetElement(element) {
    // Twitter-specific selectors for both timeline and profile tweets
    if (element.matches('[class="x1lliihq"]')) return true
    else {
        var curr = element.childNodes[0]
        for (var _ = 0; _ < 9; _++) {
            if (!curr) return false
            if (!curr.childNodes) return false
            curr = curr.childNodes[0]
        }
        return (curr.childNodes.length > 1)
    }
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

function handleMutations_functored(mutations) {
    for (const mutation of mutations) {
        // Check added nodes
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
                // Check if the node is an element and matches our tweet criteria
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // If the node itself is a tweet
                    if (isTweetElement(node)) {
                        processTweet(node, true);
                    }

                    // Check children for tweets (in case tweets are nested in added containers)
                    const tweetElements = node.querySelectorAll("div");
                    tweetElements.forEach((tweetElement) => {
                        if (isTweetElement(tweetElement)) {
                            processTweet(tweetElement, true);
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
async function initializeObservers() {
    await new Promise(resolve => setTimeout(resolve, 1000)); // fuck you 2
    let elem = document.querySelectorAll("[class='x1lliihq']")[0];
    // console.log(elem);
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
            var existingTweets = container.querySelectorAll("[class='x1lliihq']");

            existingTweets.forEach((tweet) => {
                if (isTweetElement(tweet)) {
                    processTweet(tweet);
                }
            });
            // console.log(elem)
            console.log("processing the OG")
            processTweet(elem)

            return
        }
    } else {
        elems = document.querySelectorAll("[class='x1yztbdb']");
        var divWithoutClass = null
        elems.forEach((elem) => {
            // console.log(elem)
            var container = elem.parentNode
            const findDivWithoutClass = (parentDiv) => {
                // Convert HTMLCollection to Array for easier filtering
                const children = Array.from(parentDiv.children);

                // Find the first div that has no class attribute
                return children.find(child =>
                    child.tagName.toLowerCase() === 'div' &&
                    !child.hasAttribute('class') && child.childNodes.length > 1
                );
            };
            divWithoutClass = findDivWithoutClass(container);
        })
        if (divWithoutClass) {
            console.log(divWithoutClass)

            const observer = new MutationObserver(handleMutations_functored);
            observer.observe(divWithoutClass, {
                childList: true, // Watch for children being added or removed
                subtree: false, // Watch all descendants, not just immediate children
                attributes: false, // Don't watch for attribute changes
            });
            activeObservers.push(observer);
            console.log(`Tweet monitor initialized for ${divWithoutClass}`);

            // // Process any existing tweets
            var existingTweets = divWithoutClass.querySelectorAll("div");

            existingTweets.forEach((tweet) => {
                if (isTweetElement(tweet)) {
                    console.log(tweet)
                    processTweet(tweet, true)
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

// Initialize periodic updates when the extension loads
let updateIntervalId;

function initializeCountUpdates() {
    const site_key = window.location.href;
    let dataobj = {};
    dataobj[site_key] = 0;

    chrome.storage.sync.set(dataobj).then(() => {
        console.log("Updated filtered count in storage:", dataobj[site_key]);
        // Reset global counter after successful update
        globalFilteredCount = 0;
    }).catch((error) => {
        console.error("Error updating filtered count:", error);
    });

    // Start periodic updates every 30 seconds
    updateIntervalId = startPeriodicUpdates(2000);

    // Add cleanup on window unload
    window.addEventListener('unload', () => {
        stopPeriodicUpdates(updateIntervalId);
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
