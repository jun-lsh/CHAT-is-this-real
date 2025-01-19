
// type 1
const vidRecTag = "YTD-COMPACT-VIDEO-RENDERER";
const vidMainTag = "YTD-RICH-GRID-MEDIA";
const vidSearchTag = "YTD-VIDEO-RENDERER";

const vidPlaylistTag = "YT-LOCKUP-VIEW-MODEL";
const vidShortTag1 = "YTM-SHORTS-LOCKUP-VIEW-MODEL";
const vidShortTag2 = "YTM-SHORTS-LOCKUP-VIEW-MODEL-V2";

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


function isRecommendation(node) {
    return (
        node.tagName == vidRecTag ||
        node.tagName == vidMainTag ||
        node.tagName == vidSearchTag ||
        node.tagName == vidPlaylistTag ||
        node.tagName == vidShortTag1 ||
        node.tagName == vidShortTag2
    );
}

function isBad(url) {
    return true
}

function addReportInfo() {
    console.log("addReportInfo");
    let midbar = document.querySelector("#middle-row");
    if (!midbar) {
        setTimeout(addReportInfo, 1000);
        return;
    }

    let url = document.URL;

    (async () => {
        // For every tweet in the list, query the server for a list of reports concerning the tweet
        let types = ["misinformation", "trigger", "slop", "epilepsy"];
        let threshold_votes = 5;
        let remove_threshold = 8.0;

        let prefs = await getContentPreferences();

        const digestBuffer = await digestMessage(url);
        let hash = "yt" + "_" + digestBuffer;
        let response = await apiRequestServiceWorker("GET", "/reports/" + hash);
        
        if (!response || !response.data) return

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

        let flag_category = "none";
        let flag_text = "";
        let max_upvotes = 0;
        for (let i = 0; i < types.length; i++) {
            if (max_ratio[i] > remove_threshold) {
                if (upvotes[i] > max_upvotes) {
                    max_upvotes = upvotes[i];
                    flag_category = types[i];
                    flag_text = category_text[i];
                }
            }
        }

        // flag_category = "slop"
        if (flag_category == "none") return;

        const createWarning = createWarningElement(flag_category);
        const warning = await createWarning();
        console.log("WARNIG", warning);
        midbar.appendChild(warning);
    })();
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
        hashVal: document.URL,
        site: "yt",
        display: document.title,
    });
    button.addEventListener("click", showPopup);
    menubar.appendChild(button);
}

async function processThumbnail(thumbnailElement) {
    console.log("Processing", thumbnailElement);
    let url = thumbnailElement.querySelector("a").href;

    // For every tweet in the list, query the server for a list of reports concerning the tweet
    let types = ["misinformation", "trigger", "slop", "epilepsy"];
    let threshold_votes = 5;
    let remove_threshold = 8.0;

    let prefs = await getContentPreferences();

    const digestBuffer = await digestMessage(url);
    let hash = "yt" + "_" + digestBuffer;
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
        
        // max_ratio = [9, 0, 0, 0, 0];
        // upvotes = [10, 0, 0, 0, 0];

        if ((prefs.misinformation && max_ratio[0] > remove_threshold)
            || (prefs.trigger && max_ratio[1] > remove_threshold)
            || (prefs.slop && max_ratio[2] > remove_threshold)
            || (prefs.epilepsy && max_ratio[3] > remove_threshold)
        ) {
            // hide post
            updateFilteredCount(1);

            thumbnailElement.parentNode.removeChild(thumbnailElement);
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

            console.log(flag_category);

            if (flag_category !== "none") {
                markThumbnail(thumbnailElement, flag_category)
            }
        }
    }
}



function waitUntilTrue(predicate, interval = 500) {
    return new Promise((resolve, reject) => {
        if (typeof predicate !== "function") {
            reject(new Error("Predicate must be a function"));
            return;
        }

        const checkCondition = () => {
            try {
                if (predicate()) {
                    resolve();
                } else {
                    setTimeout(checkCondition, interval);
                }
            } catch (error) {
                reject(error);
            }
        };

        checkCondition();
    });
}


function createWarningElement(type, customMessage = "") {
    // Function to inject CSS
    async function injectStyles() {
        if (!document.getElementById("warning-styles")) {
            try {
                const response = await fetch(
                    chrome.runtime.getURL("src/ingestor/warning.css")
                );
                const css = await response.text();

                const style = document.createElement("style");
                style.id = "warning-styles";
                style.textContent = css;
                document.head.appendChild(style);
            } catch (error) {
                console.error("Error loading warning styles:", error);
            }
        }
    }

    // Function to inject HTML
    async function createWarningHTML() {
        try {
            // Load HTML template
            const response = await fetch(
                chrome.runtime.getURL("src/ingestor/warning.html")
            );
            const html = await response.text();

            // Create temporary container and insert HTML
            const div = document.createElement("div");
            div.innerHTML = html;

            // Get the warning container
            const warningElement = div.firstElementChild;

            // Add type-specific class
            warningElement.classList.add(`ext-warning-${type}`);

            // Set the warning message
            const description = warningElement.querySelector(
                ".ext-warning-description"
            );
            description.textContent = customMessage || warningMessages[type];

            return warningElement;
        } catch (error) {
            console.error("Error creating warning HTML:", error);
            return null;
        }
    }

    // Return a function that creates the warning element
    return async function () {
        await injectStyles();
        return await createWarningHTML();
    };
}

function shieldElement() {
    let svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );
    svg.setAttribute("width", "48");
    svg.setAttribute("height", "48");
    svg.setAttribute("viewBox", "-4 -4 32 32");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "red");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    let svgwrapper = document.createElement("div");
    svgwrapper.style.position = "absolute";
    svgwrapper.style.top = 0;
    svgwrapper.setAttribute("z-index", 99);
    svgwrapper.appendChild(svg);

    // svg.setAttribute("position", "absolute");
    // svg.setAttribute("left", "0px");
    // svg.setAttribute("top", "0px");

    let path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );
    path.setAttribute(
        "d",
        "M12.356 3.066a1 1 0 0 0-.712 0l-7 2.666A1 1 0 0 0 4 6.68a17.695 17.695 0 0 0 2.022 7.98 17.405 17.405 0 0 0 5.403 6.158 1 1 0 0 0 1.15 0 17.406 17.406 0 0 0 5.402-6.157A17.694 17.694 0 0 0 20 6.68a1 1 0 0 0-.644-.949l-7-2.666Z"
    );
    svg.appendChild(path);
    
    return svgwrapper;
}

const handleNewElement =  (element) => {
    if (element.tagName == vidRecTag || element.tagName == vidMainTag || element.tagName == vidSearchTag ) {
        processThumbnail(element);
    } else if (element.tagName == vidPlaylistTag) {
        handleNewElement2(element);
    } else if (element.tagName == vidShortTag1 || element.tagName == vidShortTag2) {
        
    }
}

const markThumbnail = (element, info) => {
    console.log("MARK", element);
    (async () => {
        await waitUntilTrue(() => element?.querySelector("#thumbnail")?.querySelector("yt-image")?.querySelector("img")?.src)  
        
        let ytimg = element.querySelector("#thumbnail").querySelector("yt-image");    
        let newsrc = ytimg.querySelector("img").src;

        let img = document.createElement("img");
        img.src = newsrc;
        img.style.filter = "blur(10px)";
        img.setAttribute("width", "100%");
        img.setAttribute("height", "100%");
        img.setAttribute("z-index", 0)

        if (info) {
            let text = document.createElement("span");
            text.textContent = info.toUpperCase();
            text.style.fontWeight = "bold"
            text.style.position = "absolute"
            text.style.left = "50%"
            text.style.top = "45%"
            text.style.fontSize = element.tagName == vidRecTag ? "12px" : "20px";
            text.style.color = "red"
            text.style.transform = "translateX(-50%)";
            ytimg.prepend(text);
        }
        
        let svgwrapper = shieldElement();

        let containing = document.createElement("div");
        containing.style.position = "relative"

        containing.prepend(svgwrapper);
        containing.prepend(img);

        ytimg.prepend(containing);
    })();
};

const handleNewElement2 = (element) => {
    (async () => {
        await waitUntilTrue(
            () =>
                element
                    ?.querySelector(".yt-thumbnail-view-model__image")
                    ?.querySelector("img")?.src
        );

        let ytimg = element
            .querySelector(".yt-thumbnail-view-model__image")
        let newsrc = ytimg.querySelector("img").src;

        let img = document.createElement("img");
        img.src = newsrc;
        img.style.filter = "blur(10px)";
        img.setAttribute("width", "100%");
        img.setAttribute("height", "100%");
        img.setAttribute("z-index", 0);

        let svgwrapper = shieldElement();

        let containing = document.createElement("div");
        containing.style.position = "relative";

        containing.prepend(svgwrapper);
        containing.prepend(img);

        ytimg.prepend(containing);
    })();
};

// Function to handle changes to an existing <ytd-compact-video-renderer> element
const handleModifiedElement = (element) => {
    console.log("Modified rec:", element);
};

// Set up the MutationObserver
const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
        if (mutation.type === "childList") {
            // Handle added nodes
            mutation.addedNodes.forEach((node) => {
                if (
                    node.nodeType === Node.ELEMENT_NODE &&
                    isRecommendation(node)
                ) {
                    handleNewElement(node);
                }
            });

            // Handle removed nodes (if needed)
            mutation.removedNodes.forEach((node) => {
                if (
                    node.nodeType === Node.ELEMENT_NODE &&
                    isRecommendation(node)
                ) {
                    console.log("Removed rec:", node);
                }
            });
        } else if (
            mutation.type === "attributes" &&
            isRecommendation(mutation.target)
        ) {
            // Handle attribute changes on <ytd-compact-video-renderer> elements
            console.log("MUT", mutation);
            if (mutation.target.tagName == vidPlaylistTag) {
                // handleNewElement2(mutation.target)
            }
        }
    });
});

let updateIntervalId;

function initializeCountUpdates() {
    // Start periodic updates every 30 seconds
    updateIntervalId = startPeriodicUpdates(1000);

    // Add cleanup on window unload
    window.addEventListener("unload", () => {
        stopPeriodicUpdates(updateIntervalId);
    });
}

function initialize() {
    addReportInfo();
    addMenu();
    initializeCountUpdates();

    // Start observing the document
    observer.observe(document.body, {
        childList: true, // Observe child nodes being added or removed
        subtree: true, // Observe changes to all descendants
        attributes: true, // Observe attribute changes
    });

    for (let elem of document.querySelectorAll("ytd-compact-video-renderer, ytd-rich-grid-media, ytd-video-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2")) {
        setTimeout(() => handleNewElement(elem), 0)
    }
}

initialize();