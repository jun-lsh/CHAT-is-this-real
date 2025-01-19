function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

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
        if(reportInfo['site'] == 'fb') repUrl.innerHTML = "Reporting: " + reportInfo['username'] + "'s post on Facebook"
        else if(reportInfo['site'] == 'tw') repUrl.innerHTML = "Reporting: " + reportInfo['username'] + "'s post on Twitter"
        else if(reportInfo['site'] == 'yt') repUrl.innerHTML = "Reporting: " + reportInfo['display']

        const repHash = document.getElementById("reportHash");
        repHash.innerHTML = "Hash: " + siteHash
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

        submitButton.addEventListener("click", async () => {
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

            let {privateKey, publicKey} = await getKeys();
            if (!(privateKey && publicKey)) {
                alert("Your user identity keys are invalid or not yet generated! Please visit the settings page to generate new keys!");
                return;
            }
            const exportedPublic = await window.crypto.subtle.exportKey("raw", publicKey);

            const formData = {
                pkey: arrayBufferToHex(exportedPublic),
                report_text: message,
                report_type: reportValue,
                report_time: new Date().toISOString(),
                report_hash: await generateHash(),
                platform_name: reportInfo["site"],
            };
            let challenge = formData.pkey+formData.report_text+formData.report_type+formData.report_time+formData.report_hash+formData.platform_name
            console.log("formData in form", challenge)
            let enc = new TextEncoder();
            let encoded_text = enc.encode(challenge);
            let signature = await window.crypto.subtle.sign(
                {
                    name: "ECDSA",
                    hash: {name: "SHA-384"},
                },
                privateKey,
                encoded_text,
            );

            formData.signature = arrayBufferToHex(signature);

            await apiRequestServiceWorker("POST", "/reports", null, formData);

            console.log("Form submitted:", formData);
            hidePopup();
            alert("Thank you for the report!")

            // Reset form
            messageInput.value = "";
        });
    }

    function createReportView(report) {

        const card = document.createElement('div');
        card.style.padding = '16px';
        card.style.border = '1px solid #ddd';
        card.style.borderRadius = '8px';
        card.style.maxWidth = '600px';
        card.style.margin = '20px';
        card.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    
        // Create top row container
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'center';
        topRow.style.marginBottom = '12px';
    
        // Create title
        const titleElement = document.createElement('h2');
        titleElement.textContent = "Reported for " + report["report_type"];
        titleElement.style.margin = '0';
        titleElement.style.fontSize = '20px';
    
        // Create voting container
        const votingContainer = document.createElement('div');
        votingContainer.style.display = 'flex';
        votingContainer.style.alignItems = 'center';
        votingContainer.style.gap = '8px';
    
        // Create vote counter
        const voteCount = document.createElement('span');
        var votes = report['upvote'] - report['downvote'];
        voteCount.textContent = votes;
        voteCount.style.margin = '0 8px';
    
        // Create upvote button
        const upvoteBtn = document.createElement('button');
        upvoteBtn.textContent = '↑';
        upvoteBtn.style.padding = '4px 8px';
        upvoteBtn.style.border = '1px solid #ddd';
        upvoteBtn.style.borderRadius = '4px';
        upvoteBtn.style.cursor = 'pointer';
        upvoteBtn.style.backgroundColor = '#f0f0f0';
        upvoteBtn.addEventListener('click', () => {
            votes++;
            voteCount.textContent = votes;
        });
    
        // Create downvote button
        const downvoteBtn = document.createElement('button');
        downvoteBtn.textContent = '↓';
        downvoteBtn.style.padding = '4px 8px';
        downvoteBtn.style.border = '1px solid #ddd';
        downvoteBtn.style.borderRadius = '4px';
        downvoteBtn.style.cursor = 'pointer';
        downvoteBtn.style.backgroundColor = '#f0f0f0';
        downvoteBtn.addEventListener('click', () => {
            votes--;
            voteCount.textContent = votes;
        });
    
        // Create description
        const descElement = document.createElement('p');
        descElement.textContent = "Reasoning: " + report["report_text"];
        descElement.style.margin = '0';
        descElement.style.lineHeight = '1.5';
        descElement.style.color = '#666';
    
        // Assemble the components
        votingContainer.appendChild(upvoteBtn);
        votingContainer.appendChild(voteCount);
        votingContainer.appendChild(downvoteBtn);
    
        topRow.appendChild(titleElement);
        topRow.appendChild(votingContainer);
    
        card.appendChild(topRow);
        card.appendChild(descElement);

        return card
    }

    async function showPopup() {
        const postHash = await generateHash()
        console.log(postHash)
        const response = await apiRequestServiceWorker('GET', '/reports/' + postHash);
        console.log(response)
        // Ensure styles and HTML are injected before showing
        await Promise.all([injectStyles(), injectPopupHTML()]); 
        await setValues(postHash);
        console.log("displaying popup", postHash)
        const popup = document.getElementById('myFormPopup');
        
        popup.style.display = 'block';

        const reportContainer = document.getElementById("reportContainer");
        reportContainer.innerHTML = ''
        const reportView = document.getElementById("reportView");

        let reports = response["data"];
        reports = [...new Map(reports.map(item => [item.id, item])).values()]
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