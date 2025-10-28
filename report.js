document.addEventListener('DOMContentLoaded', () => {
    
    const lostForm = document.getElementById('lost-form');
    const foundForm = document.getElementById('found-form');
    const backendUrl = 'http://localhost:3000';

    if (lostForm) {
        lostForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // 1. Create a FormData object
            // This is how we send files + text together
            const formData = new FormData();
            
            // 2. Add all the text values
            formData.append('itemName', document.getElementById('lost-item-name').value);
            formData.append('category', document.getElementById('lost-category').value);
            formData.append('location', document.getElementById('lost-location').value);
            formData.append('date', document.getElementById('lost-date').value);
            formData.append('description', document.getElementById('lost-description').value);
            formData.append('contactName', document.getElementById('lost-contact-name').value);
            formData.append('contactEmail', document.getElementById('lost-contact-email').value);
            
            // 3. Get the file (if it exists)
            const imageFile = document.getElementById('lost-image').files[0];
            if (imageFile) {
                // 'image' MUST match the server: upload.single('image')
                formData.append('image', imageFile); 
            }

            // 4. Send the FormData
            try {
                // Show a loading alert
                alert('Submitting... Please wait.');

                const response = await fetch(`${backendUrl}/api/lost`, {
                    method: 'POST',
                    // NO 'Content-Type' header. The browser sets it for FormData.
                    body: formData,
                });
                const result = await response.json();
                if (result.success) {
                    alert('Lost item report submitted successfully!');
                    lostForm.reset();
                } else {
                    alert('Error submitting report: ' + result.message);
                }
            } catch (error) {
                console.error(error);
                alert('Could not connect to the server. Is it running?');
            }
        });
    }

    if (foundForm) {
        foundForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 1. Create a FormData object
            const formData = new FormData();

            // 2. Add all text values
            formData.append('itemName', document.getElementById('found-item-name').value);
            formData.append('category', document.getElementById('found-category').value);
            formData.append('location', document.getElementById('found-location').value);
            formData.append('date', document.getElementById('found-date').value);
            formData.append('description', document.getElementById('found-description').value);
            formData.append('contactName', document.getElementById('found-contact-name').value);
            formData.append('contactEmail', document.getElementById('found-contact-email').value);

            // 3. Get the file (if it exists)
            const imageFile = document.getElementById('found-image').files[0];
            if (imageFile) {
                // 'image' MUST match the server: upload.single('image')
                formData.append('image', imageFile); 
            }

            // 4. Send the FormData
            try {
                // Show a loading alert
                alert('Submitting... Please wait.');

                const response = await fetch(`${backendUrl}/api/found`, {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                
                // --- FIXING A TYPO FROM BEFORE ---
                if (result.success) {
                    alert('Found item report submitted successfully!');
                    foundForm.reset();
                } else {
                    alert('Error submitting report: ' + result.message);
                }
            } catch (error) {
                console.error(error);
                alert('Could not connect to the server. Is it running?');
            }
        });
    }
});

