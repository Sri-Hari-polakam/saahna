let cart = JSON.parse(localStorage.getItem('sahnaa_cart')) || [];

function saveCart() {
    localStorage.setItem('sahnaa_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const counts = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    // Use Math.ceil to show total whole items/meters in badge
    counts.forEach(count => count.innerText = Math.ceil(totalItems));
}

function injectCartHTML() {
    if (document.getElementById('cartSidebar')) return;
    
    const html = `
        <div class="cart-overlay" id="cartOverlay"></div>
        <div class="cart-sidebar" id="cartSidebar">
            <div class="cart-header">
                <h3>Your Bag</h3>
                <i class="fas fa-times" id="closeCart" style="cursor: pointer;"></i>
            </div>
            <div class="cart-items" id="cartItemsList">
                <!-- Cart items will be rendered here -->
            </div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Total:</span>
                    <span id="cartTotalPrice">₹0</span>
                </div>
                <a href="checkout.html" class="btn btn-gold" style="width: 100%; text-align: center;">Proceed to Checkout</a>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('closeCart').addEventListener('click', toggleCart);
    document.getElementById('cartOverlay').addEventListener('click', toggleCart);
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartItemsList');
    list.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        const customInfo = item.customDetails ? `
            <div style="font-size: 0.75rem; color: var(--primary-gold); background: #fdfaf0; padding: 5px 8px; border-radius: 6px; margin-top: 5px;">
                <i class="fas fa-cut"></i> Custom: ${item.customDetails.fabric}<br>
                <i class="fas fa-sticky-note"></i> ${item.customDetails.customNotes.substring(0, 30)}...
            </div>
        ` : '';
        
        const isFabric = item.category === 'Fabrics';
        const qtyLabel = isFabric ? 'Meters' : 'Qty';

        div.innerHTML = `
            <div class="cart-item-img" style="background-image: url('${item.image}')"></div>
            <div class="cart-item-details">
                <h4 style="margin: 0;">${item.name}</h4>
                <p style="font-size: 0.8rem; color: #666; margin: 2px 0;">Size: ${item.size}</p>
                ${customInfo}
                <div style="display: flex; align-items: center; gap: 0.8rem; margin: 10px 0;">
                    <div class="quantity-controls-mini">
                        <button onclick="updateQuantity(${index}, ${isFabric ? -0.5 : -1})" ${item.quantity <= (isFabric ? 0.5 : 1) ? 'disabled' : ''}>-</button>
                        <span>${item.quantity}${isFabric ? 'm' : ''}</span>
                        <button onclick="updateQuantity(${index}, ${isFabric ? 0.5 : 1})">+</button>
                    </div>
                    <span style="font-weight: 600;">₹${(item.price * item.quantity).toLocaleString()}</span>
                </div>
                <span style="color: #ff4d4d; cursor: pointer; font-size: 0.8rem;" onclick="removeFromCart(${index})">Remove</span>
            </div>
        `;
        list.appendChild(div);
    });

    const totalElement = document.getElementById('cartTotalPrice');
    if (totalElement) totalElement.innerText = `₹${total.toLocaleString()}`;
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    renderCart();
};

window.updateQuantity = (index, change) => {
    cart[index].quantity += change;
    const isFabric = cart[index].category === 'Fabrics';
    const minQty = isFabric ? 0.5 : 1;
    if (cart[index].quantity < minQty) cart[index].quantity = minQty;
    
    // Round to avoid floating point issues (e.g. 0.1 + 0.2)
    cart[index].quantity = Math.round(cart[index].quantity * 10) / 10;
    
    saveCart();
    updateCartUI();
    renderCart();
};

function addToCart(productId, size = 'M', productData = null, quantity = 1) {
    const product = productData || { id: productId, name: "Product " + productId, price: 10000, image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200' };
    const img = product.image || (product.images ? product.images[0] : 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200');
    
    const existingItem = cart.find(item => item.id === productId && item.size === size);
    const qtyToAdd = parseFloat(quantity);
    
    if (existingItem) {
        existingItem.quantity += qtyToAdd;
    } else {
        const availableSizes = product.sizes && product.sizes.length ? product.sizes : ['S','M','L','XL','Free Size'];
        cart.push({ ...product, image: img, size, quantity: qtyToAdd, availableSizes });
    }
    
    saveCart();
    updateCartUI();
    toggleCart(); // Open cart when item is added
}

window.addToCart = addToCart;

// Share Product Utility
window.shareProduct = function(pid, event) {
    if (event) event.stopPropagation();
    
    // Notify server of share
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api' 
        : 'https://saahna-production.up.railway.app/api';
        
    fetch(`${API_URL}/products/${pid}/share`, { method: 'POST' }).catch(() => {});
    
    const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
    const shareUrl = `${baseUrl}/product-details.html?id=${pid}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'SAAHNA Luxury Boutique',
            text: 'Check out this exquisite piece from SAAHNA!',
            url: shareUrl
        }).catch(err => {
            copyToClipboard(shareUrl);
        });
    } else {
        copyToClipboard(shareUrl);
    }
};

function copyToClipboard(text) {
    const dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    
    // Show toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: #1a1a1a; color: white; padding: 1rem 2rem; border-radius: 50px;
        z-index: 9999; font-size: 0.9rem; letter-spacing: 1px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid var(--primary-gold);
        animation: toastFade 3s forwards;
    `;
    toast.innerHTML = '<i class="fas fa-link" style="color:var(--primary-gold); margin-right: 10px;"></i> Link Copied to Clipboard';
    
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes toastFade {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            15% { opacity: 1; transform: translate(-50%, 0); }
            85% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    injectCartHTML();
    updateCartUI();
    
    // Add listener to all cart icons
    document.querySelectorAll('.cart-icon').forEach(btn => {
        btn.addEventListener('click', toggleCart);
    });

    // Inject Mobile Menu Toggle
    const navContainer = document.querySelector('nav .container');
    if (navContainer && !document.getElementById('mobile-menu')) {
        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'menu-toggle';
        toggleDiv.id = 'mobile-menu';
        toggleDiv.innerHTML = '<i class="fas fa-bars"></i>';
        
        const navIcons = navContainer.querySelector('.nav-icons');
        if (navIcons) {
            navIcons.insertBefore(toggleDiv, navIcons.firstChild);
        } else {
            const iconsContainer = document.createElement('div');
            iconsContainer.className = 'nav-icons';
            iconsContainer.appendChild(toggleDiv);
            navContainer.appendChild(iconsContainer);
        }

        toggleDiv.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.toggle('active');
        });
    }

    // Inject Floating Enquire Button
    if (!document.getElementById('floatingEnquireBtn')) {
        const btnHtml = `
            <a href="https://wa.me/919652926366" id="floatingEnquireBtn" class="floating-enquire-btn" target="_blank">
                <i class="fab fa-whatsapp" style="font-size: 2rem;"></i>
            </a>
        `;
        document.body.insertAdjacentHTML('beforeend', btnHtml);
    }
});
