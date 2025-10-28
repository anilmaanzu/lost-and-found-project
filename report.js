document.addEventListener('DOMContentLoaded', () => {
    
    const lostForm = document.getElementById('lost-form');
    const foundForm = document.getElementById('found-form');
    
    // --- THIS IS THE CRITICAL CHANGE ---
    // This URL points to your LIVE backend server on Render
    const backendUrl = "https://lost-and-found-server-bhajan.onrender.com"; 
    // Example: "https://lost-and-found-server-bhajan.onrender.com"

    // Helper function to handle form submission
    async function handleFormSubmit(e, formType) {
        e.preventDefault();
        
        let form, endpoint;
        if (formType === 'lost') {
            form = lostForm;
            endpoint = `${backendUrl}/api/lost`;
        } else {
            form = foundForm;
            endpoint = `${backendUrl}/api/found`;
        }

        // Use FormData to send text and files
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Add visual feedback
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData, // No 'Content-Type' header needed, FormData handles it
            });

            const result = await response.json();

            if (result.success) {
                alert('Report submitted successfully!');
                form.reset();
            } else {
                // Provide more specific error messages if available
                alert('Error submitting report: ' + (result.message || 'Unknown server error. Please check server logs.'));
            }
        } catch (error) {
            console.error('Submit error:', error);
            // Give a clearer network error message
            alert('Could not connect to the server. Please check your internet connection or if the server is running.');
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText; // Use the saved text
        }
    }

    // Attach listeners only if the forms exist on the current page
    if (lostForm) {
        lostForm.addEventListener('submit', (e) => handleFormSubmit(e, 'lost'));
    }

    if (foundForm) {
        foundForm.addEventListener('submit', (e) => handleFormSubmit(e, 'found'));
    }
});

