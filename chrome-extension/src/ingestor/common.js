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
            description.textContent = warningMessages[type];
            if(customMessage) description.textContent = warningMessages[type] + "\n" + customMessage;

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