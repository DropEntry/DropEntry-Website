document.getElementById('pdfInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        console.log("File uploaded");
        
        // Create a FileReader to read the file
        const reader = new FileReader();
        
        // Define the onloadend event handler for the FileReader
        reader.onloadend = function() {
            // The result attribute contains the data as a base64 encoded string
            const base64data = reader.result;
            
            // Send the Base64 data to your event listener
            window.postMessage({
                type: "FROM_EXTENSION",
                // Assuming you're still needing to send a worker URL for PDF.js or similar
                workerUrl: window.location.origin + '/lib/pdf.worker.js',
                base64data: base64data // Send the Base64 data instead of the blob URL
            }, "*");
        };
        
        // Read the file as a Base64 encoded string
        reader.readAsDataURL(file);
    }
});



window.addEventListener("message", function(event) {
    // Check the origin and message type for security
    if (event.source !== window || !event.data.type) return;

    if (event.data.type === "FROM_PAGE") {
        console.log("Response from the page:", event.data.data);
        
        /*
        updateBillDetails(invoiceID, tenantID, { "LineItems": event.data.data })
            .then(updatedBill => {
                console.log('Updated bill:', updatedBill);
                window.location.reload();
            })
            .catch(error => console.error('Error updating bill:', error));
        */
    }
});



/*
document.getElementById('pdfUploader').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        console.log("File uploaded");
        // Read the file as a Base64 string
        const reader = new FileReader();
        reader.onloadend = function() {
            // Extract the Base64 encoded data
            const base64data = reader.result.split(',')[1];
            
            // Send the data to your event listener
            window.postMessage({
                type: "FROM_EXTENSION",
                base64data: base64data,
                // You might need to adjust the workerUrl according to your setup
                workerUrl: "path/to/pdf.worker.js"
            }, "*");


            //  window.postMessage({ type: "FROM_EXTENSION", workerUrl: chrome.runtime.getURL('lib/pdf.worker.mjs'), pdfUrl: testUrl }, "*");
        };
        reader.readAsDataURL(file);
    }
});
*/


document.getElementById('pdfInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file || file.type !== "application/pdf") {
        console.error("Please select a PDF file.");
        return;
    }

    // Create a URL for the selected file
    const fileURL = URL.createObjectURL(file);

    // Set the URL as the source of the iframe
    const pdfViewer = document.getElementById('pdfViewer');
    pdfViewer.src = fileURL;
    pdfViewer.hidden = false; // Make sure to show the iframe if it was initially hidden
});