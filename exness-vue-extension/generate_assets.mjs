import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, 'public', 'icons');

// Base64 của một chấm vàng 1x1 pixel (PNG)
// Chúng ta sẽ dùng tạm cái này cho mọi size, Chrome Extension chấp nhận resize tự động ở mức hiển thị
// Tuy nhiên để upload Store thì tốt nhất nên thay bằng ảnh thật sau.
const yellowPixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
const buffer = Buffer.from(yellowPixelBase64, 'base64');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(iconsDir)){
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Ghi file
['icon16.png', 'icon48.png', 'icon128.png'].forEach(file => {
    fs.writeFileSync(path.join(iconsDir, file), buffer);
    console.log(`Generated ${file}`);
});

console.log("Icons generated successfully!");
