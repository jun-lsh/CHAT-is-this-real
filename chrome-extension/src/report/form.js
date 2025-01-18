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

    async function generateHash(){
        const digestBuffer = await digestMessage(reportInfo["hashVal"])
        return reportInfo["site"] + "_" + digestBuffer
    }

    async function setValues(siteHash){
        const repUrl = document.getElementById("reportName");
        repUrl.innerHTML = "Reporting: " + siteHash
    }

    function setupEventListeners() {
        const popup = document.getElementById("myFormPopup");
        const closeButton = document.getElementById("closePopup");
        const submitButton = document.getElementById("submitButton");
        const reportType = document.getElementById("reportType");
        const messageInput = document.getElementById("messageInput");
        const messageLabel = document.getElementById("messageLabel");

        closeButton.addEventListener("click", hidePopup);

        popup.addEventListener("click", (e) => {
            if (e.target === popup) {
                hidePopup();
            }
        });

        reportType.addEventListener("change", () => {
            let reportValue = reportType.value;
            if (
                reportValue !== "epilepsy" &&
                reportValue !== "slop" 
            ) {
                messageLabel.textContent = "Message (Required)"
            } else {
                messageLabel.textContent = "Message (Optional)"
            }
        })

        submitButton.addEventListener("click", () => {
            const reportValue = reportType.value;
            const message = messageInput.value.trim();

            // Validation logic
            if (
                reportValue !== "epilepsy" &&
                reportValue !== "slop" &&
                message === ""
            ) {
                alert("Description is required for this report type.");
                return;
            }

            const formData = {
                reportType: reportValue,
                message: message,
            };
            console.log("Form submitted:", formData);
            hidePopup();
            alert("Thank you for the report!")

            // Reset form
            messageInput.value = "";
        });
    }

    function createReportView(report) {
        let view = document.createElement("div")
        view.style.paddingBottom = "8px"

        console.log(report)
        let title = document.createElement("h2")
        title.textContent = "Report about"
        view.append(title)

        let span = document.createElement("span");
        span.textContent = "" + report["report_text"];
        view.appendChild(span)

        return view
    }

    async function showPopup() {
        const postHash = await generateHash()
        const response = await apiRequestServiceWorker('GET', '/reports/' + postHash);
        console.log(response)
        // Ensure styles and HTML are injected before showing
        await Promise.all([injectStyles(), injectPopupHTML()]); 
        await setValues(postHash);
        console.log("displaying popup", postHash)
        const popup = document.getElementById('myFormPopup');
        
        popup.style.display = 'block';

        const reportContainer = document.getElementById("reportContainer");
        const reportView = document.getElementById("reportView");

        let reports = response["data"];

        if (!reports.length) {
            reportView.style.display = "none";
        } else {
            reportView.style.display = "block";
            for (let report of reports) {
                reportContainer.appendChild(createReportView(report))
            }
        }
        
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