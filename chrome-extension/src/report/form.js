function createFormPopup(reportInfo) {
    // Function to inject CSS
    async function injectStyles() {
        if (!document.getElementById('popup-styles')) {
            try {
                const response = await fetch(chrome.runtime.getURL('src/report/form.css'));
                const css = await response.text();
                
                const style = document.createElement('style');
                style.id = 'popup-styles';
                style.textContent = css;
                document.head.appendChild(style);
            } catch (error) {
                console.error('Error loading popup styles:', error);
            }
        }
    }

    // Function to inject HTML
    async function injectPopupHTML() {
        if (!document.getElementById('myFormPopup')) {
            try {
                // Load and inject HTML
                const response = await fetch(chrome.runtime.getURL('src/report/form.html'));
                const html = await response.text();

                const div = document.createElement('div');
                div.innerHTML = html;
                document.body.appendChild(div.firstElementChild);
                setupEventListeners();
            } catch (error) {
                console.error('Error loading popup HTML:', error);
            }
        }
    }

    async function setValues(){
        const repUrl = document.getElementById("reportName");
        console.log(reportInfo["hashVal"])
        const digestBuffer = await digestMessage(reportInfo["hashVal"])
        repUrl.innerHTML = "Reporting: " + digestBuffer
        // Setup event listeners after HTML is injected
        return digestBuffer
        
    }

    function setupEventListeners() {
        const popup = document.getElementById('myFormPopup');
        const closeButton = document.getElementById('closePopup');
        const nextButton = document.getElementById('nextButton');
        const prevButton = document.getElementById('prevButton');
        const submitButton = document.getElementById('submitButton');
        const page1 = document.getElementById('page1');
        const page2 = document.getElementById('page2');

        closeButton.addEventListener('click', hidePopup);

        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                hidePopup();
            }
        });

        nextButton.addEventListener('click', () => {
            page1.classList.add('hidden');
            page2.classList.remove('hidden');
        });

        prevButton.addEventListener('click', () => {
            page2.classList.add('hidden');
            page1.classList.remove('hidden');
        });

        submitButton.addEventListener('click', () => {
            const formData = {
                name: document.getElementById('nameInput').value,
                email: document.getElementById('emailInput').value,
                message: document.getElementById('messageInput').value
            };
            console.log('Form submitted:', formData);
            hidePopup();
            // Reset form
            document.getElementById('nameInput').value = '';
            document.getElementById('emailInput').value = '';
            document.getElementById('messageInput').value = '';
        });
    }

    async function showPopup() {
        // Ensure styles and HTML are injected before showing
        await Promise.all([injectStyles(), injectPopupHTML()]); 
        const digestBuffer = await setValues();
        console.log("displaying popup", digestBuffer)
        const popup = document.getElementById('myFormPopup');
        const page1 = document.getElementById('page1');
        const page2 = document.getElementById('page2');
        
        popup.style.display = 'block';
        page1.classList.remove('hidden');
        page2.classList.add('hidden');
        
    }

    function hidePopup() {
        const popup = document.getElementById('myFormPopup');
        popup.style.display = 'none';
    }

    // Return the showPopup function
    return showPopup;
}

// Export the function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createFormPopup;
}