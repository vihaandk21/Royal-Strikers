# 👑 Royal Strikers

A premium sports club website for **Throwball**, **Volleyball**, and **Badminton** tournaments. Designed with a luxury hyper-modern aesthetic and a robust backend flow.

🌐 **Live Site**: [royal-strikers-sports-club.vercel.app](https://royal-strikers-rust.vercel.app/)

---

## 📂 Project Structure

```
Royal-Strikers/
├── index.html          # Landing page (hero, sports, about, gallery)
├── register.html       # Dedicated registration form & receipt generator
├── css/
│   └── styles.css      # All styling (Luxury UI, variables, mobile responsive)
├── js/
│   └── main.js         # Core logic (OCR, Web3Forms, ImgBB, WhatsApp integration)
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Hyper-Luxury UI** | Premium dark-mode aesthetic with gold accents, magnetic cursors, smooth scroll (Lenis), and cinematic reveal animations. |
| **Dynamic Registration Flow** | Smart form that adapts fields dynamically based on the number of players selected (1–15). |
| **Aadhaar OCR Verification** | Auto-detects age from uploaded Aadhaar images via Tesseract.js to strictly enforce U-18 and Above-18 brackets. |
| **ImgBB Cloud Storage** | Uploaded IDs and Payment proofs are automatically hosted on ImgBB via API, ensuring lightweight payload processing. |
| **Web3Forms Backend** | Complete roster and image links are securely bundled and sent directly to the admin email without complex backend servers. Includes `botcheck` honeypot for spam protection. |
| **WhatsApp Integration** | Bypasses mobile popup blockers by generating an explicit button to send the structured roster directly to the admin's WhatsApp. |
| **UPI Payment Module** | Generates a fully copyable UPI ID and a dynamic QR code modal for instant payments. |
| **Real-Time Validations** | Custom Toast Notifications system providing instant feedback for file uploads, OCR scanning, and form submission states. |
| **Responsive Design** | Flawless cross-device scaling from 4K desktop monitors down to mobile viewports. |

---

## 🛠️ Tech Stack

- **Frontend Core**: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Typography & Animations**: Google Fonts (Cinzel, Outfit), CSS Keyframes, IntersectionObserver
- **Image Processing**: Tesseract.js (Client-side OCR for Age Verification)
- **Cloud APIs**: ImgBB API (Image Hosting), Web3Forms API (Email Delivery)
- **Build & Deploy**: Vite, Vercel

---

## 🚀 Getting Started

### Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/vihaandk21/Royal-Strikers.git
   ```

2. Install dependencies (if using Vite):
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

### Deploy to Vercel

The site auto-deploys from the `main` branch directly to [royal-strikers-rust.vercel.app](https://royal-strikers-rust.vercel.app/).

---

## 🔧 Configuration & Integrations

### ImgBB API
Used for hosting images from the registration form:
Set in `js/main.js`:
```js
const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY';
```

### Web3Forms API
Used for delivering registration payloads to email:
Set in `register.html`:
```html
<input type="hidden" name="access_key" value="YOUR_WEB3FORMS_KEY">
```

### WhatsApp Contact
The admin phone number is configured for WhatsApp intent links:
Set in `js/main.js`:
```js
const adminPhone = "918296398607";
```

---

## 👥 Credits

Developed by **Shreesha** and **Vihaan**.

---

## 📝 License

All rights reserved. © 2026 Royal Strikers.
