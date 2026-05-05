const categories = ["Sarees", "Men's Wear", "Co - ord sets", "One - Piece Dress", "Frocks", "Fabrics", "Kurtis", "Lehangas", "Kid's Wear"];
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
