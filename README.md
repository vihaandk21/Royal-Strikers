# 👑 Royal Strikers

A premium sports club website for **Throwball**, **Volleyball**, and **Badminton** tournaments.

🌐 **Live Site**: [royal-strikers-rust.vercel.app](https://royal-strikers-rust.vercel.app/)

---

## 📂 Project Structure

```
Royal-Strikers/
├── index.html          # Landing page (hero, sports, about)
├── register.html       # Dedicated registration form page
├── css/
│   └── styles.css      # All styles (shared across pages)
├── js/
│   └── main.js         # All JavaScript logic (shared across pages)
├── throwball.jpg       # Hero background & Throwball card image
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Landing Page** | Hero section, sport cards, and about section |
| **Registration Page** | Dedicated form page with full validation |
| **Web3Forms Backend** | Form data + file attachments sent silently to email |
| **UPI Payment** | Launches UPI payment app after successful registration |
| **Aadhaar OCR** | Auto-detects age from uploaded Aadhaar image via Tesseract.js |
| **Mobile Responsive** | Hamburger menu and responsive layout for all screen sizes |
| **Toast Notifications** | Real-time feedback for form submission, errors, and payment |
| **Accessibility** | Proper labels, alt text, ARIA attributes, semantic HTML |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — External stylesheet, dark theme, responsive design
- **Vanilla JavaScript** — Form handling, OCR, toast system
- **Web3Forms** — Free form submission backend
- **Tesseract.js v4** — Client-side OCR for Aadhaar age verification (lazy-loaded)
- **Vercel** — Hosting & deployment

---

## 🚀 Getting Started

### Run Locally

1. Clone the repository:
   ```
   git clone https://github.com/vihaandk21/Royal-Strikers.git
   ```

2. Open `index.html` in any browser:
   ```
   start index.html
   ```

   Or use a local dev server:
   ```
   npx serve .
   ```

### Deploy to Vercel

The site auto-deploys from `main` to [royal-strikers-rust.vercel.app](https://royal-strikers-rust.vercel.app/).

---

## 🔧 Configuration

### Web3Forms API Key

The API key is set in `register.html` inside the form:
```html
<input type="hidden" name="access_key" value="YOUR_API_KEY">
```

Configure the receiving email in the [Web3Forms Dashboard](https://web3forms.com/).

### UPI Payment

The UPI payment ID is set in `js/main.js`:
```js
window.location.href = 'upi://pay?pa=YOUR_UPI_ID&pn=Royal%20Strikers&cu=INR';
```

**Admin Contact**: +91 82963 98607

---

## 👥 Credits

Developed by **Shreesha** and **Vihaan**.

---

## 📝 License

All rights reserved. © 2026 Royal Strikers.
