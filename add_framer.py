import re

with open('js/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

framer_imports = '''import { animate, stagger, inView, scroll } from "framer-motion";

// --- CINEMATIC ANIMATIONS (>₹10L AESTHETIC) ---
document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById("preloader");
    if (preloader) {
        // Preloader Sequence
        animate("#preloader-text", { opacity: [0, 1], y: [20, 0] }, { duration: 0.8, ease: [0.22, 1, 0.36, 1] })
            .then(() => {
                return animate("#preloader", { opacity: 0 }, { duration: 0.8, delay: 0.5, ease: "easeInOut" });
            })
            .then(() => {
                preloader.style.display = "none";
                // Trigger Hero animations after preloader finishes
                animate(".hero h1", { opacity: [0, 1], y: [50, 0] }, { duration: 1, ease: [0.22, 1, 0.36, 1] });
                animate(".hero p", { opacity: [0, 1], y: [20, 0] }, { duration: 1, delay: 0.2, ease: "easeOut" });
                animate(".hero .buttons .btn", { opacity: [0, 1], scale: [0.9, 1] }, { duration: 0.8, delay: stagger(0.1, { startDelay: 0.4 }) });
            });
    } else {
        // Fallback if no preloader
        animate(".hero h1", { opacity: [0, 1], y: [50, 0] }, { duration: 1, ease: [0.22, 1, 0.36, 1] });
    }

    // Scroll Triggers for Cards
    inView(".card", ({ target }) => {
        animate(target, { opacity: [0, 1], y: [50, 0] }, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    }, { margin: "-100px" });

    // Scroll Triggers for general sections
    inView("section .title", ({ target }) => {
        animate(target, { opacity: [0, 1], x: [-30, 0] }, { duration: 0.8, ease: "easeOut" });
    }, { margin: "-50px" });
});
'''

if 'from "framer-motion"' not in js:
    js = framer_imports + '\n\n' + js

with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Added framer-motion to main.js")
