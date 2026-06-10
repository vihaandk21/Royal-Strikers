# 👑 Royal Strikers

A premium sports club website for **Throwball**, **Volleyball**, and **Badminton** tournaments. Built as a static HTML/CSS/JS site, hosted on Vercel.

---

## 📂 Project Structure

```
Royal-Strikers/
├── index.html       # Main website (HTML + inline CSS + inline JS)
├── throwball.jpg     # Hero & Throwball card image
├── README.md         # This file
└── .gitignore        # Git ignore rules
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Registration Form** | Collects name, phone, sport, age category, and Aadhaar proof |
| **Web3Forms Backend** | Form data (including file attachments) sent silently to email/dashboard |
| **UPI Payment** | Launches UPI payment app after successful registration |
| **Aadhaar OCR** | Auto-detects age from uploaded Aadhaar image using Tesseract.js |
| **Mobile Responsive** | Hamburger menu and responsive layout for all screen sizes |
| **Toast Notifications** | Real-time feedback for form submission, errors, and payment |
| **Accessibility** | Proper labels, alt text, ARIA attributes, semantic HTML |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Inline styles, dark theme, responsive design
- **Vanilla JavaScript** — Form handling, OCR, toast system
- **Web3Forms** — Free form submission backend
- **Tesseract.js v4** — Client-side OCR for Aadhaar age verification (lazy-loaded)
- **Vercel** — Hosting

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

The site is already deployed on Vercel. Any push to `main` will auto-deploy.

---

## 🔧 Configuration

### Web3Forms API Key

The API key is set in `index.html` inside the form:
```html
<input type="hidden" name="access_key" value="YOUR_API_KEY">
```

Configure the receiving email address in the [Web3Forms Dashboard](https://web3forms.com/).

### UPI Payment

The UPI payment ID is set in the JavaScript at the bottom of `index.html`:
```js
window.location.href = 'upi://pay?pa=YOUR_UPI_ID&pn=Royal%20Strikers&cu=INR';
```

---

## 👥 Credits

Developed by **Shreesha** and **Vihaan**.

---

## 📝 License

All rights reserved. © 2026 Royal Strikers.
