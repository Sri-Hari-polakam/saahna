const categories = ["Sarees", "Fusion Ware", "Men's Wear", "Co - ord sets", "One - Piece Dress", "Frocks", "Fabrics", "Kurtis", "Lehangas", "Kid's Wear"];
const templates = [
    { price: 12500, desc: "Classic Banarasi silk.", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800", sizes: ["Free Size"] },
    { price: 2500, desc: "Premium Italian linen.", image: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800", sizes: ["S","M","L","XL"] },
    { price: 85000, desc: "Matching bride & groom outfits.", image: "https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800", sizes: ["Custom"] },
    { price: 4500, desc: "Elegant velvet dress.", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800", sizes: ["S","M","L","XL"] },
    { price: 3200, desc: "Beautiful designer frock.", image: "https://images.unsplash.com/photo-1622290319146-7b63fd48a609?auto=format&fit=crop&q=80&w=800", sizes: ["S","M","L"] }
];
const adjectives = ["Royal", "Classic", "Premium", "Elegant", "Luxury", "Designer", "Modern", "Traditional", "Festive", "Casual"];
const colors = ["Gold", "White", "Blue", "Peach", "Midnight", "Emerald", "Ruby", "Silver", "Ivory", "Rose", "Crimson"];

window.localProducts = [];
for (let i = 1; i <= 200; i++) {
    const category = categories[i % categories.length];
    const t = templates[i % templates.length];
    const adj = adjectives[i % adjectives.length];
    const color = colors[i % colors.length];
    
    window.localProducts.push({
        id: i,
        name: `${adj} ${color} ${category.split(" ")[0]} ${i}`,
        category: category,
        price: t.price + (i * 10),
        description: t.desc + " Exclusive edition.",
        sizes: t.sizes,
        image: t.image
    });
}

// Ensure Fusion Ware has its demo products even in local mode
const fusionDemo = [
    { id: 1001, name: 'Regal Fusion Velvet Gown', category: 'Fusion Ware', price: 14500, discountPrice: 12000, description: 'A perfect blend of traditional velvet craftsmanship and modern silhouette.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800', sizes: ['S','M','L','XL'] },
    { id: 1002, name: 'Indigo Draped Fusion Set', category: 'Fusion Ware', price: 11000, discountPrice: 8500, description: 'Contemporary draped styling meets ethnic indigo prints.', image: 'https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800', sizes: ['S','M','L'] },
    { id: 1003, name: 'Gold Embroidered Fusion Cape', category: 'Fusion Ware', price: 9500, discountPrice: 7500, description: 'Ethereal fusion cape with intricate zardosi embroidery.', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', sizes: ['Free Size'] },
    { id: 1004, name: 'Emerald Velvet Kaftan', category: 'Fusion Ware', price: 13000, discountPrice: 10500, description: 'Luxurious emerald velvet kaftan with metallic silver threadwork.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800', sizes: ['Free Size'] },
    { id: 1005, name: 'Peplum & Dhoti Co-ord', category: 'Fusion Ware', price: 8500, discountPrice: 6500, description: 'Modern peplum top paired with traditional draped dhoti pants.', image: 'https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800', sizes: ['S','M','L'] },
    { id: 1006, name: 'Sequinned Fusion Sari-Gown', category: 'Fusion Ware', price: 18000, discountPrice: 15500, description: 'The elegance of a saree meets the ease of a gown.', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', sizes: ['S','M','L','XL'] },
    { id: 1007, name: 'Zardosi Work Crop Top & Culottes', category: 'Fusion Ware', price: 9000, discountPrice: 7200, description: 'Intricate zardosi embroidery on a raw silk crop top.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800', sizes: ['XS','S','M'] }
];
window.localProducts.push(...fusionDemo);
