document.addEventListener('DOMContentLoaded', () => {

    const lostGallery = document.getElementById('lost-gallery');
    const foundGallery = document.getElementById('found-gallery');
    
    // --- THIS IS THE CRITICAL CHANGE ---
    // This URL points to your LIVE backend server on Render
    const backendUrl = "PASTE_YOUR_LIVE_RENDER_URL_HERE"; 
    // Example: "https://lost-and-found-server-bhajan.onrender.com"

    // Helper function to create an item card
    function createItemCard(item, type) {
        const card = document.createElement('div');
        card.className = `item-card ${type}-card`;

        // Check if image URL exists
        let cardImage;
        if (item.image_url) {
            // Use the full URL from Cloudinary
            cardImage = `<img src="${item.image_url}" alt="${item.item_name}" class="card-image">`;
        } else {
            // Fallback placeholder
            cardImage = `
                <div class="card-image-placeholder">
                    <span>No Image</span>
                </div>
            `;
        }

        // Format the date
        const itemDate = new Date(item.lost_date || item.found_date).toLocaleDateString('en-IN');
        const dateLabel = type === 'lost' ? 'Lost On' : 'Found On';

        card.innerHTML = `
            ${cardImage}
            <div class="card-content">
                <h3>${item.item_name}</h3>
                <p><strong>Location:</strong> ${item.lost_location || item.found_location}</p>
                <p><strong>${dateLabel}:</strong> ${itemDate}</p>
                <p class="card-description">${item.description || 'No description.'}</p>
            </div>
        `;
        return card;
    }

    // Function to load LOST items
    async function loadLostItems() {
        if (!lostGallery) return; // Make sure the element exists
        try {
            const response = await fetch(`${backendUrl}/api/lost-items`);
            const result = await response.json();

            if (result.success && result.items.length > 0) {
                lostGallery.innerHTML = ''; // Clear loading text
                result.items.forEach(item => {
                    const card = createItemCard(item, 'lost');
                    lostGallery.appendChild(card);
                });
            } else {
                lostGallery.innerHTML = '<p class="empty-feed-msg">No lost items reported yet.</p>';
            }
        } catch (error) {
            console.error('Error fetching lost items:', error);
            lostGallery.innerHTML = '<p class="empty-feed-msg">Could not load lost items.</p>';
        }
    }

    // Function to load FOUND items
    async function loadFoundItems() {
        if (!foundGallery) return; // Make sure the element exists
        try {
            const response = await fetch(`${backendUrl}/api/found-items`);
            const result = await response.json();

            if (result.success && result.items.length > 0) {
                foundGallery.innerHTML = ''; // Clear loading text
                result.items.forEach(item => {
                    const card = createItemCard(item, 'found');
                    foundGallery.appendChild(card);
                });
            } else {
                foundGallery.innerHTML = '<p class="empty-feed-msg">No found items reported yet.</p>';
            }
        } catch (error) {
            console.error('Error fetching found items:', error);
            foundGallery.innerHTML = '<p class="empty-feed-msg">Could not load found items.</p>';
        }
    }

    // Load both feeds
    loadLostItems();
    loadFoundItems();
});

