let cart = JSON.parse(localStorage.getItem('sahnaa_cart')) || [];

function saveCart() {
    localStorage.setItem('sahnaa_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const counts = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    counts.forEach(count => count.innerText = totalItems);
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
        div.innerHTML = `
            <div class="cart-item-img" style="background-image: url('${item.image}')"></div>
            <div class="cart-item-details">
                <h4 style="margin: 0;">${item.name}</h4>
                <p style="font-size: 0.8rem; color: #666; margin: 2px 0;">Size: ${item.size}</p>
                <p style="font-weight: 600; margin: 5px 0;">${item.quantity} x ₹${item.price.toLocaleString()}</p>
                <span style="color: #D4AF37; cursor: pointer; font-size: 0.8rem; text-decoration: underline;" onclick="removeFromCart(${index})">Remove</span>
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

function addToCart(productId, size = 'M', productData = null, quantity = 1) {
    const product = productData || { id: productId, name: "Product " + productId, price: 10000, image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200' };
    const img = product.image || (product.images ? product.images[0] : 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200');
    
    const existingItem = cart.find(item => item.id === productId && item.size === size);
    
    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        cart.push({ ...product, image: img, size, quantity: parseInt(quantity) });
    }
    
    saveCart();
    updateCartUI();
    toggleCart(); // Open cart when item is added
}

window.addToCart = addToCart;

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
});
