let wishlist = JSON.parse(localStorage.getItem('sahnaa_wishlist')) || [];

window.saveWishlist = function() {
    localStorage.setItem('sahnaa_wishlist', JSON.stringify(wishlist));
    if (window.updateWishlistUI) window.updateWishlistUI();
}

window.updateWishlistUI = function() {
    const counts = document.querySelectorAll('.wishlist-count');
    counts.forEach(count => count.innerText = wishlist.length);
    
    // Update heart icons on product cards if they exist
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const pid = parseInt(btn.dataset.pid);
        if (wishlist.some(i => i.id === pid)) {
            btn.innerHTML = '<i class="fas fa-heart" style="color:#ff4444;"></i>';
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    });
}

window.toggleWishlist = function(pid) {
    // Find the product from global data arrays
    let p = null;
    if (window.allProductsData) p = window.allProductsData.find(x => x.id === pid);
    if (!p && window.allHomeProductsData) p = window.allHomeProductsData.find(x => x.id === pid);
    if (!p && window.allProducts) p = window.allProducts.find(x => x.id === pid); 
    
    if (!p) {
        // Fallback if toggling from a page where we don't have full data but removing it
        p = wishlist.find(x => x.id === pid);
        if (!p) {
            console.error("Product not found to add to wishlist");
            return;
        }
    }

    const index = wishlist.findIndex(item => item.id === pid);
    if (index > -1) {
        wishlist.splice(index, 1); // Remove if exists
    } else {
        wishlist.push(p); // Add if doesn't exist
    }
    
    window.saveWishlist();
};

window.removeFromWishlist = function(id) {
    wishlist = wishlist.filter(item => item.id !== id);
    window.saveWishlist();
    if(window.renderWishlist) window.renderWishlist();
};

document.addEventListener('DOMContentLoaded', () => {
    window.updateWishlistUI();
});
