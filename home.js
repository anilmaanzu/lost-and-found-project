document.addEventListener('DOMContentLoaded', () => {
    
    const lostGallery = document.getElementById('lost-gallery-container');
    const foundGallery = document.getElementById('found-gallery-container');
    const backendUrl = 'http://localhost:3000';

    // Helper function to create an item card
    function createItemCard(item, itemType) {
        const card = document.createElement('div');
        card.className = 'item-card';

        let dateText, locationText, dateValue, locationValue;
        if (itemType === 'lost') {
            dateText = 'Lost On';
            locationText = 'Last Seen';
            dateValue = item.lost_date;
            locationValue = item.lost_location;
        } else {
            dateText = 'Found On';
            locationText = 'Found At';
            dateValue = item.found_date;
            locationValue = item.found_location;
        }
        
        // Format date to dd/mm/yyyy (Indian standard)
        const itemDate = new Date(dateValue).toLocaleDateString('en-IN'); 

        // === THIS IS THE UPDATED PART ===
        // Check if an image_url exists. If yes, use <img>. If not, use placeholder.
        const imageElement = item.image_url
            ? `<img src="${item.image_url}" alt="${item.item_name}" class="card-image">`
            : `<div class="card-image-placeholder"><span>No Image</span></div>`;
        // === END OF UPDATED PART ===

        card.innerHTML = `
            ${imageElement} 
            <div class="card-content">
                <h3>${item.item_name}</h3>
                <p><strong>${locationText}:</strong> ${locationValue}</p>
                <p><strong>${dateText}:</strong> ${itemDate}</p>
                <p class="card-description">${item.description || ''}</p> 
            </div>
        `;
        // We add the '|| ""' to description to prevent "null" from showing up
        
        card.classList.add(itemType === 'lost' ? 'lost-card' : 'found-card');
        return card;
    }

    // --- Function to load LOST items ---
    async function loadLostItems() {
        try {
            const response = await fetch(`${backendUrl}/api/lost-items`);
            const result = await response.json();
            if (result.success && result.items.length > 0) {
                lostGallery.innerHTML = ''; 
                result.items.forEach(item => {
                    const card = createItemCard(item, 'lost');
                    lostGallery.appendChild(card);
                });
            } else {
                lostGallery.innerHTML = '<p class="empty-feed-msg">No lost items reported yet.</p>';
            }
        } catch (error) {
            console.error('Error loading lost items:', error);
            lostGallery.innerHTML = '<p class="empty-feed-msg">Could not connect to server.</p>';
        }
    }

    // --- Function to load FOUND items ---
    async function loadFoundItems() {
        try {
            const response = await fetch(`${backendUrl}/api/found-items`);
            const result = await response.json();
            if (result.success && result.items.length > 0) {
                foundGallery.innerHTML = ''; 
                result.items.forEach(item => {
                    const card = createItemCard(item, 'found');
                    foundGallery.appendChild(card);
                });
            } else {
                foundGallery.innerHTML = '<p class="empty-feed-msg">No found items reported yet.</p>';
            }
        } catch (error) {
            console.error('Error loading found items:', error);
            foundGallery.innerHTML = '<p class="empty-feed-msg">Could not connect to server.</p>';
        }
    }

    // --- Load BOTH feeds ---
    loadLostItems();
    loadFoundItems();
});

