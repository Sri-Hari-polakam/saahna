const fs = require('fs');
const path = require('path');

const newFooter = `<footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <h4 class="logo">SAAHNA</h4>
                    <p style="color: var(--text-muted);">2nd Floor, Thota’s Vivedha Apartment, Vijayawada.</p>
                </div>
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="about.html">About Us</a></li>
                        <li><a href="services.html">Our Services</a></li>
                        <li><a href="contact.html">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Policies</h4>
                    <ul>
                        <li><a href="refund-policy.html">Refund Policy</a></li>
                        <li><a href="shipping-policy.html">Shipping Policy</a></li>
                        <li><a href="privacy-policy.html">Privacy Policy</a></li>
                        <li><a href="terms.html">Terms & Conditions</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact Us</h4>
                    <p>+91 9652926366</p>
                    <p>saahna.sa@gmail.com</p>
                </div>
                <div class="footer-col">
                    <h4>Follow SAAHNA</h4>
                    <div class="socials">
                        <a href="https://instagram.com/saahna.sa" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" target="_blank" title="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" target="_blank" title="YouTube"><i class="fab fa-youtube"></i></a>
                        <a href="#" target="_blank" title="Pinterest"><i class="fab fa-pinterest"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </footer>`;

const directoryPath = __dirname;
const regex = /<footer>[\s\S]*?<\/footer>/i;

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 

    files.forEach(function (file) {
        if (path.extname(file) === '.html' && file !== 'index.html') {
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            if (regex.test(content)) {
                content = content.replace(regex, newFooter);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated footer in: ${file}`);
            } else {
                console.log(`No footer tag found in: ${file}`);
            }
        }
    });
});
