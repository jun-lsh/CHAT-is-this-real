
// type 1
const vidRecTag = "YTD-COMPACT-VIDEO-RENDERER";
const vidMainTag = "YTD-RICH-GRID-MEDIA";
const vidSearchTag = "YTD-VIDEO-RENDERER";


const vidPlaylistTag = "YT-LOCKUP-VIEW-MODEL";
const vidShortTag1 = "YTM-SHORTS-LOCKUP-VIEW-MODEL";
const vidShortTag2 = "YTM-SHORTS-LOCKUP-VIEW-MODEL-V2";

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
        handleNewElement1(element);
    } else if (element.tagName == vidPlaylistTag) {
        handleNewElement2(element);
    } else if (element.tagName == vidShortTag1 || element.tagName == vidShortTag2) {
        
    }
}

const handleNewElement1 = (element) => {
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
                handleNewElement2(mutation.target)
            }
        }
    });
});

// Start observing the document
observer.observe(document.body, {
    childList: true, // Observe child nodes being added or removed
    subtree: true, // Observe changes to all descendants
    attributes: true, // Observe attribute changes
});

for (let elem of document.querySelectorAll("ytd-compact-video-renderer, ytd-rich-grid-media, ytd-video-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2")) {
    setTimeout(() => handleNewElement(elem), 0)
}
