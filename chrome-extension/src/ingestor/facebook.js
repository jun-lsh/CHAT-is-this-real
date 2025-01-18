// content.js

// Configuration for the observer
const observerConfig = {
    childList: true, // Watch for children being added or removed
    subtree: true, // Watch all descendants, not just immediate children
    attributes: false, // Don't watch for attribute changes
};

// Keep track of active observers
let activeObservers = [];

function addTextBoxUnderTweet(tweetNode, text, offset = false) {
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
    // console.log(tweetNode)
    // Add the text content
    textBox.textContent = text;
    if (!offset) {
        var curr = tweetNode.childNodes[0]
        for (var _ = 0; _ < 11; _++) {

            if (curr.childNodes.length == 1) curr = curr.childNodes[0]
            else curr = curr.childNodes[1]
        }
        if (curr.childNodes.length > 1) return
        curr.appendChild(textBox);
    } else {
        var curr = tweetNode.childNodes[0]
        for (var _ = 0; _ < 8; _++) {
            curr = curr.childNodes[0]
        }
        console.log(curr)
        if (curr.childNodes.length > 1) return
        curr.appendChild(textBox);
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

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.type === "attributes") {
                console.log("attributes changed");
                console.log(mutation.target.getAttribute('href'))
                var deets = postDetails(mutation.target.getAttribute('href'))
                if(deets){
                    observer.disconnect()
                    console.log("Printing", deets)
                    addTextBoxUnderTweet(
                        tweetElement,
                        "^ THIS POST IS 100% NOT MISINFORMATION!! ^",
                        offset
                    );
                    addReportButtonToTweet(tweetElement, deets, offset)
                    
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
                        var observer2 = new MutationObserver(function(mutations) {
                            mutations.forEach(function(mutation) {
                              if (mutation.type === "attributes") {
                                console.log("attributes changed");
                                console.log(mutation.target.getAttribute('href'))
                                var deets = postDetails(mutation.target.getAttribute('href'))
                                if(deets){
                                    console.log(deets)
                                    addTextBoxUnderTweet(
                                        tweetElement,
                                        "^ THIS POST IS 100% NOT MISINFORMATION!! ^",
                                        offset
                                    );
                                    addReportButtonToTweet(tweetElement, deets, offset)
                                    observer.disconnect()
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
}

// Function to identify tweet elements
function isTweetElement(element) {
    // Twitter-specific selectors for both timeline and profile tweets
    if (element.matches('[class="x1lliihq"]')) return true
    else {
        var curr = element.childNodes[0]
        for (var _ = 0; _ < 9; _++) {
            if(!curr) return false
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
