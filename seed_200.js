const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const categories = [
    "Sarees", "Men's Wear", "Co - ord sets", "One - Piece Dress", "Frocks",
    "Fabrics", "Kurtis", "Lehangas", "Kid's Wear"
];

const templates = [
    { name: "Royal Gold Banarasi", price: 12500, description: "Classic Banarasi silk.", sizes: ["Free Size"], image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800" },
    { name: "Linen White Shirt", price: 2500, description: "Premium Italian linen.", sizes: ["S","M","L","XL"], image: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800" },
    { name: "Royal Couple Combo", price: 85000, description: "Matching bride & groom outfits.", sizes: ["Custom"], image: "https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800" },
    { name: "Midnight Blue Velvet Dress", price: 4500, description: "Elegant midnight blue velvet dress.", sizes: ["S","M","L","XL"], image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800" },
    { name: "Peach Floral Frock", price: 3200, description: "Beautiful peach floral designer frock.", sizes: ["S","M","L"], image: "https://images.unsplash.com/photo-1622290319146-7b63fd48a609?auto=format&fit=crop&q=80&w=800" },
    { name: "Silk Kurti", price: 3000, description: "Elegant silk kurti.", sizes: ["S","M","L"], image: "file:///C:/Users/23000/.gemini/antigravity/brain/2863ac14-dfb1-4ac9-a2ee-4e653707edf4/kurtis_category_1776856195744.png" },
    { name: "Designer Lehanga", price: 15000, description: "Bridal designer lehanga.", sizes: ["Custom"], image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800" },
    { name: "Kids Ethnic Wear", price: 2000, description: "Comfortable kids ethnic wear.", sizes: ["2Y", "4Y", "6Y"], image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=800" }
];

const adjectives = ["Royal", "Classic", "Premium", "Elegant", "Luxury", "Designer", "Modern", "Traditional", "Festive", "Casual"];
const colors = ["Gold", "White", "Blue", "Peach", "Midnight", "Emerald", "Ruby", "Silver", "Ivory", "Rose", "Crimson"];

function generateProduct(id) {
    const category = categories[id % categories.length];
    const template = templates[id % templates.length];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
        id: id,
        name: `${adj} ${color} ${category.split(" ")[0]} ${id}`,
        category: category,
        price: template.price + (id * 10),
        discountPrice: template.price + (id * 10) - 500,
        stock: 20 + (id % 10),
        description: template.description + ` Exclusive ${adj.toLowerCase()} edition.`,
        fabric: "Mixed",
        care: "Dry Clean",
        image: template.image,
        sizes: template.sizes
    };
}

const products = [];
for (let i = 1; i <= 200; i++) {
    products.push(generateProduct(i));
}

// 1. Update js/data.js
const dataJsContent = `window.localProducts = ${JSON.stringify(products, null, 4)};\n`;
fs.writeFileSync('./js/data.js', dataJsContent);

// 2. Update Database
const db = new sqlite3.Database('./sahnaa_sa.db');
db.serialize(() => {
    db.run("DELETE FROM products");
    const stmt = db.prepare(`INSERT INTO products (id, name, category, price, discountPrice, stock, description, fabric, care, images, sizes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    products.forEach(p => {
        stmt.run([
            p.id, p.name, p.category, p.price, p.discountPrice, p.stock, p.description, 
            p.fabric, p.care, JSON.stringify([p.image]), JSON.stringify(p.sizes)
        ]);
    });
    stmt.finalize();
    console.log("Database updated with 200 products.");
});
db.close();
