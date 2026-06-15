import { animate, stagger, inView, scroll } from "framer-motion/dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";




/* =================================================================
   ROYAL STRIKERS — Application Logic
   =================================================================
   Modules:
     1. Toast Notification System
     2. Hamburger Menu Toggle
     3. Aadhaar OCR Age Verification (Tesseract.js — lazy-loaded)
     4. Form Submission via Web3Forms + UPI Redirect
     5. UPI Copy-to-Clipboard Utility
   ================================================================= */

// ────────────────────────────────────────────────────────────────
// 1. TOAST NOTIFICATION SYSTEM
//    Creates slide-in notifications for user feedback.
//    Types: 'success' (green), 'error' (red), 'info' (gold)
// ────────────────────────────────────────────────────────────────

/**
 * Displays a toast notification that auto-dismisses after 5 seconds.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'info'} type - Visual style
 */
function showToast(message, type) {
    type = type || 'info';

    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);

    // Auto-dismiss after 5 seconds
    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        toast.style.transition = '0.4s ease';
        setTimeout(function () { toast.remove(); }, 400);
    }, 5000);
}

// ────────────────────────────────────────────────────────────────
// 2. HAMBURGER MENU TOGGLE (mobile navigation)
//    Runs on every page that has the hamburger + navMenu elements.
// ────────────────────────────────────────────────────────────────
(function initHamburgerMenu() {
    var hamburger = document.getElementById('hamburger');
    var navMenu   = document.getElementById('navMenu');

    if (!hamburger || !navMenu) return; // guard for pages without nav

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when any nav link is tapped
    var links = navMenu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function () {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    }
})();

// ────────────────────────────────────────────────────────────────
// 3. AADHAAR OCR — AUTO AGE CATEGORY DETECTION
//    Only runs on the register page (guards for missing elements).
//    Lazy-loads Tesseract.js v5 from CDN when user uploads an image.
//    Searches for multiple DOB patterns on Indian Aadhaar cards.
//    Falls back gracefully if OCR fails, times out, or file is a PDF.
// ────────────────────────────────────────────────────────────────
(function initAadhaarVerification() {

    // Age logic relies on direct DOB cutoff Date comparison.

    // Removed getAgeCategory since age category is no longer used

    /**
     * Attempts to extract a Date of Birth from OCR text.
     * Tries multiple patterns commonly found on Aadhaar cards:
     *   1. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (most common)
     *   2. Year of Birth keyword followed by a 4-digit year
     * @param {string} text - Raw OCR output
     * @returns {Date|null}
     */
    function extractDOB(text) {
        // Pattern 1: Full date DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        // Added tolerance for spaces and common OCR misreads of slashes (|, l, I)
        var fullDate = text.match(/(\d{2})\s*[\/\-\.\|lI]\s*(\d{2})\s*[\/\-\.\|lI]\s*(\d{4})/);
        if (fullDate) {
            var day   = parseInt(fullDate[1], 10);
            var month = parseInt(fullDate[2], 10) - 1;
            var year  = parseInt(fullDate[3], 10);
            if (year > 1920 && year < 2027 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                return new Date(year, month, day);
            }
        }

        // Pattern 2: Year of Birth only (some Aadhaar cards show only year)
        // Added tolerance for noise characters between the word and the year
        var yobMatch = text.match(/(?:year|yob|birth|dob)[^\d]{0,8}(\d{4})/i);
        if (yobMatch) {
            var y = parseInt(yobMatch[1], 10);
            if (y > 1920 && y < 2027) {
                return new Date(y, 0, 1);
            }
        }

        return null;
    }

    /**
     * Pre-processes the image by scaling, converting to grayscale, and bumping contrast.
     * This drastically improves Tesseract OCR accuracy.
     */
    function preprocessImageForOCR(file) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            var url = URL.createObjectURL(file);
            img.onload = function() {
                URL.revokeObjectURL(url);
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                
                // Scale up if image is small (helps Tesseract resolve characters)
                var scale = (img.width < 1000) ? 2 : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                // Apply high-contrast grayscale filter
                ctx.filter = 'grayscale(100%) contrast(250%)';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Loads Tesseract.js v5 from CDN and returns a ready worker.
     * Uses createWorker() for explicit lifecycle control.
     */
    async function loadAndRunOCR(imageUrl) {
        // Load the library script if not already present
        if (!window.Tesseract) {
            await new Promise(function (resolve, reject) {
                var s  = document.createElement('script');
                s.src  = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                s.onload  = resolve;
                s.onerror = function () { reject(new Error('Failed to load Tesseract.js')); };
                document.head.appendChild(s);
            });
        }

        // Create a dedicated worker, run OCR, then terminate
        var worker = await Tesseract.createWorker('eng', 1, {
            logger: function () {} // silence internal logs
        });
        var result = await worker.recognize(imageUrl);
        await worker.terminate();
        return result.data.text;
    }

    window.attachAadhaarOCR = function(aadhaarInput, status) {
        aadhaarInput.addEventListener('change', async function (e) {
            var file = e.target.files[0];
            if (!file) { status.innerHTML = ''; return; }

            // PDFs can't be OCR'd client-side — skip gracefully
            if (!file.type.startsWith('image/')) {
                status.innerHTML = '<span class="warning">📄 PDF uploaded — we will verify your document manually via WhatsApp.</span>';
                return;
            }

            status.innerHTML = '<span class="scanning"><span class="spinner"></span> Scanning Aadhaar for age verification...</span>';

            // 30-second timeout so it doesn't hang forever
            var timeoutId;
            var timeoutPromise = new Promise(function (_, reject) {
                timeoutId = setTimeout(function () {
                    reject(new Error('OCR timed out'));
                }, 30000);
            });

            try {
                var enhancedImageUrl = await preprocessImageForOCR(file);

                var ocrPromise = loadAndRunOCR(enhancedImageUrl);
                var text = await Promise.race([ocrPromise, timeoutPromise]);
                clearTimeout(timeoutId);

                console.log("OCR Raw Output:\n", text); // Helpful for debugging

                var dob = extractDOB(text);

                if (dob) {
                    var cutoffDate = new Date(2008, 6, 8); // July 8, 2008
                    var dobString = dob.toLocaleDateString();

                    if (dob < cutoffDate) {
                        status.innerHTML = '<span class="warning">❌ Registration blocked: DOB is ' + dobString + ' (Before cutoff: July 8, 2008). Only eligible players are allowed.</span>';
                        document.getElementById('payBtn').disabled = true;
                        document.getElementById('submitBtn').disabled = true;
                    } else if (dob >= cutoffDate) {
                        status.innerHTML = '<span class="verified">✅ DOB verified: ' + dobString + '. You may proceed.</span>';
                        if (document.getElementById('level').value) {
                            document.getElementById('payBtn').disabled = false;
                            document.getElementById('submitBtn').disabled = false;
                        }
                    } else {
                        status.innerHTML = '<span class="warning">❌ Registration blocked: Could not determine valid age. Please upload a clear Aadhaar image.</span>';
                        document.getElementById('payBtn').disabled = true;
                        document.getElementById('submitBtn').disabled = true;
                    }
                } else {
                    status.innerHTML = '<span class="warning">❌ Registration blocked: Could not read date of birth. Please upload a clear Aadhaar image.</span>';
                    document.getElementById('payBtn').disabled = true;
                }
            } catch (err) {
                clearTimeout(timeoutId);
                console.warn('Aadhaar OCR error:', err);
                status.innerHTML = '<span class="warning">❌ Registration blocked: Auto-verification failed. Please upload a clearer Aadhaar image.</span>';
                document.getElementById('payBtn').disabled = true;
                document.getElementById('submitBtn').disabled = true;
            }
        });
    };
})();


// ────────────────────────────────────────────────────────────────
// 4. PAYMENT & RECEIPT LOGIC
//    Handles level selection to display fee, the Pay via UPI button,
//    Web3Forms submission, and html2canvas receipt generation.
// ────────────────────────────────────────────────────────────────
(function initPaymentAndSubmission() {
    var form      = document.getElementById('registerForm');
    var levelSel  = document.getElementById('level');
    var feeDisp   = document.getElementById('feeDisplay');
    var amtField  = document.getElementById('amountField');
    var payBtn    = document.getElementById('payBtn');
    var upiManual = document.getElementById('upiManual');
    var submitBtn = document.getElementById('submitBtn');
    var teamSizeSel = document.getElementById('teamSize');
    var rosterContainer = document.getElementById('rosterContainer');

    if (!form) return;

    var currentAmount = 0;

    // Dynamic Roster Rendering
    function renderRoster() {
        if (!rosterContainer || !teamSizeSel) return;
        var size = parseInt(teamSizeSel.value, 10);
        if (!size) return;

        var html = '';
        var levelSel = document.getElementById('level');
        var isSchool = levelSel && levelSel.value === 'School Level';

        for (var i = 1; i <= size; i++) {
            var title = (i === 1) ? 'Player 1 (Captain)' : 'Player ' + i;
            if (size === 9 && i > 7) {
                title += ' (Optional Sub)';
            }
            
            var reqStr = (size === 9 && i > 7) ? '' : 'required';
            var idReqStr = (isSchool && reqStr) ? 'required' : '';
            var optLabel = idReqStr ? '' : ' (Optional)';

            html += '<div class="player-slot" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,223,115,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">' +
                        '<h4 style="color: #FFDF73; margin-bottom: 10px;">' + title + '</h4>' +
                        '<div class="form-group floating">' +
                            '<input type="text" id="playerName_' + i + '" name="playerName_' + i + '" placeholder=" " ' + reqStr + '>' +
                            '<label for="playerName_' + i + '">Full Name</label>' +
                        '</div>' +
                        '<div class="form-group floating">' +
                            '<input type="tel" id="playerPhone_' + i + '" name="playerPhone_' + i + '" placeholder=" " pattern="[0-9]{10}" maxlength="10" title="10-digit phone number" ' + reqStr + '>' +
                            '<label for="playerPhone_' + i + '">Phone Number</label>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="aadhaar_' + i + '">Upload Aadhaar Proof (Image/PDF)</label>' +
                            '<input type="file" id="aadhaar_' + i + '" name="aadhaar_' + i + '" accept="image/*,.pdf" ' + reqStr + '>' +
                            '<div class="verification-status" id="status_' + i + '"></div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="schoolId_' + i + '">Upload School/College ID' + optLabel + '</label>' +
                            '<input type="file" id="schoolId_' + i + '" name="schoolId_' + i + '" accept="image/*,.pdf" ' + idReqStr + '>' +
                        '</div>' +
                    '</div>';
        }
        rosterContainer.innerHTML = html;

        // Attach OCR to dynamically generated Aadhaar inputs
        for (var j = 1; j <= size; j++) {
            var aadhaarInput = document.getElementById('aadhaar_' + j);
            var statusElement = document.getElementById('status_' + j);
            if (aadhaarInput && statusElement && window.attachAadhaarOCR) {
                window.attachAadhaarOCR(aadhaarInput, statusElement);
            }
        }
    }

    if (teamSizeSel) {
        teamSizeSel.addEventListener('change', renderRoster);
    }


    // 1. Level Selection Logic
    levelSel.addEventListener('change', function () {
        var level = this.value;
        if (level === 'School Level') {
            currentAmount = 600;
            feeDisp.innerHTML = 'Fee: <strong>₹600</strong>';
            payBtn.textContent = 'Pay ₹600 via UPI';
        } else if (level === 'College Level (Under 18)' || level === 'College Level') {
            currentAmount = 1000;
            feeDisp.innerHTML = 'Fee: <strong>₹1,000</strong>';
            payBtn.textContent = 'Pay ₹1,000 via UPI';
        }
        amtField.value = currentAmount;
        payBtn.disabled = false;
        renderRoster(); // re-render roster to update required fields
    });

    // 2. Pay via UPI Button
    payBtn.addEventListener('click', function () {
        if (currentAmount === 0) return;

        // Launch UPI intent
        var upiLink = 'upi://pay?pa=8296398607@ptaxis&pn=Royal%20Strikers&cu=INR&am=' + currentAmount;
        window.location.href = upiLink;

        // Show manual fallback in case intent fails (desktop)
        setTimeout(function () {
            upiManual.style.display = 'block';
        }, 1500);
    });

    // 2.5 QR Code Modal Logic
    var qrScannerImg = document.getElementById('qrScannerImg');
    var qrModal = document.getElementById('qrModal');
    var qrModalImg = document.getElementById('qrModalImg');
    var qrClose = document.getElementById('qrClose');

    if (qrScannerImg && qrModal && qrModalImg && qrClose) {
        qrScannerImg.onclick = function(){
            qrModal.style.display = "block";
            qrModalImg.src = this.src;
        }

        qrClose.onclick = function() {
            qrModal.style.display = "none";
        }

        qrModal.onclick = function(e) {
            if (e.target !== qrModalImg) {
                qrModal.style.display = "none";
            }
        }
    }

    // 3. Receipt Generation helper
    async function generateReceipt() {
        var wrapper = document.getElementById('receiptWrapper');

        // Populate data
        document.getElementById('r-name').textContent = document.getElementById('fullName').value;
        document.getElementById('r-phone').textContent = document.getElementById('phone').value;
        var teamNameInput = document.getElementById('teamName');
        if (teamNameInput && document.getElementById('r-teamName')) {
            document.getElementById('r-teamName').textContent = teamNameInput.value || 'N/A';
        }
        document.getElementById('r-level').textContent = document.getElementById('level').value;
        document.getElementById('r-amount').textContent = '₹' + currentAmount;
        document.getElementById('r-txn').textContent = document.getElementById('transactionId').value;

        var date = new Date();
        document.getElementById('r-date').textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        wrapper.style.left = '0px';
        wrapper.style.top = '0px';
        wrapper.style.zIndex = '-100'; // keep behind

        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Yield thread to allow DOM paint cycle
            var canvas = await html2canvas(document.getElementById('receiptCaptureBox') || document.getElementById('receipt'), {
                scale: 2, // High resolution
                useCORS: true
            });

            var link = document.createElement('a');
            link.download = 'Royal-Strikers-Receipt.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Receipt generation failed:', err);
            showToast('Failed to download receipt.', 'error');
        } finally {
        wrapper.style.display = 'none';
            wrapper.style.visibility = 'hidden';
        }
    }

    // Helper for ImgBB Upload
    async function uploadToImgBB(file) {
        if (!file) return null;
        var uploadData = new FormData();
        uploadData.append('image', file);
        
        try {
            var response = await fetch('https://api.imgbb.com/1/upload?key=d9db420380b947929a48075006b9f7e4', {
                method: 'POST',
                body: uploadData
            });
            var result = await response.json();
            if (result.success) {
                return result.data.url;
            }
        } catch (e) {
            console.error('ImgBB upload error:', e);
        }
        return null;
    }

    // 4. Form Submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var phone = document.getElementById('phone').value;
        if (!/^\d{10}$/.test(phone)) {
            showToast('Please enter a valid 10-digit phone number.', 'error');
            document.getElementById('phone').focus();
            return;
        }

        var txn = document.getElementById('transactionId').value.trim();
        if (!/^\d{12}$/.test(txn)) {
            showToast('Please enter a valid 12-digit UPI Transaction ID (UTR number). Do not enter your UPI ID.', 'error');
            document.getElementById('transactionId').focus();
            return;
        }

        submitBtn.disabled  = true;
        submitBtn.innerHTML = '<span class="btn-spinner"></span> Submitting...';

        try {
            var formData = new FormData(form);
            var size = parseInt(teamSizeSel.value, 10);
            
            submitBtn.innerHTML = '<span class="btn-spinner"></span> Uploading Documents...';
            
            var waMessage = "Hello Royal Strikers! I have registered my team for the tournament.\n\n" +
                "Captain Name: " + document.getElementById('fullName').value + "\n" +
                "Phone: " + document.getElementById('phone').value + "\n" +
                "Team Name: " + (document.getElementById('teamName') ? document.getElementById('teamName').value : 'N/A') + "\n" +
                "Team Category: " + (document.getElementById('teamGender') ? document.getElementById('teamGender').value : 'N/A') + "\n" +
                "Level: " + document.getElementById('level').value + "\n" +
                "Team Size: " + (size === 6 ? '6 Players' : '6 Players + 3 Subs') + "\n" +
                "Transaction ID: " + document.getElementById('transactionId').value + "\n\n" +
                "Roster:\n";

            // Upload all documents to ImgBB and append to waMessage
            for (var i = 1; i <= size; i++) {
                var pNameInput = document.getElementById('playerName_' + i);
                if (!pNameInput || !pNameInput.value) continue; // Skip unfilled optional subs

                var pName = pNameInput.value;
                var pPhone = document.getElementById('playerPhone_' + i) ? document.getElementById('playerPhone_' + i).value : 'N/A';
                waMessage += "*" + i + ". " + pName + " (" + pPhone + ")*\n";

                var aadhaarFile = document.getElementById('aadhaar_' + i).files[0];
                var schoolIdFile = document.getElementById('schoolId_' + i).files[0];
                
                if (aadhaarFile) {
                    var aUrl = await uploadToImgBB(aadhaarFile);
                    if (aUrl) waMessage += "   Aadhaar: " + aUrl + "\n";
                }
                if (schoolIdFile) {
                    var sUrl = await uploadToImgBB(schoolIdFile);
                    if (sUrl) waMessage += "   School ID: " + sUrl + "\n";
                }
            }

            // Remove all files from formData so they don't bloat Web3Forms email limits
            for (var [key, value] of Array.from(formData.entries())) {
                if (value instanceof File) {
                    formData.delete(key);
                }
            }

            // Inject the full WhatsApp message containing ImgBB links into the Web3Forms payload
            // This ensures organizers receive the links to the uploaded player documents
            formData.set('Full Registration Details', waMessage);

            submitBtn.innerHTML = '<span class="btn-spinner"></span> Finalizing Registration...';

            var response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            var result = await response.json();

            if (result.success) {
                showToast('Registration successful! Downloading receipt...', 'success');
                await generateReceipt();

                waMessage += "\n*(Please find attached my downloaded receipt)*";
                var waUrl = "https://api.whatsapp.com/send?phone=918296398607&text=" + encodeURIComponent(waMessage);

                // Show explicit WhatsApp button instead of redirect to prevent mobile popup blockers
                submitBtn.style.display = 'none';
                var waBtn = document.getElementById('waProceedBtn');
                if (waBtn) {
                    waBtn.href = waUrl;
                    waBtn.style.display = 'block';
                }

                showToast('Please click "Complete Registration on WhatsApp" to finalize.', 'success');
            } else {
                showToast('Submission failed: ' + (result.message || 'Unknown error.'), 'error');
                submitBtn.disabled  = false;
                submitBtn.innerHTML = 'Submit &amp; Download Receipt';
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showToast('Network error. Please try again.', 'error');
            submitBtn.disabled  = false;
            submitBtn.innerHTML = 'Submit &amp; Download Receipt';
        }
    });
})();

// ────────────────────────────────────────────────────────────────
// 5. COPY UPI ID TO CLIPBOARD
// ────────────────────────────────────────────────────────────────

/**
 * Copies the UPI ID to the user's clipboard.
 * Uses modern Clipboard API with a fallback for older browsers.
 */
function copyUPI() {
    var upiIdEl = document.getElementById('upiId');
    if (!upiIdEl) return;

    var upiId = upiIdEl.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId).then(function () {
            showToast('UPI ID copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        var range = document.createRange();
        range.selectNode(upiIdEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        showToast('UPI ID copied!', 'success');
    }
}



document.addEventListener("DOMContentLoaded", () => {
    const copyBtn = document.getElementById("copyUpiBtn");
    if (copyBtn) {
        copyBtn.addEventListener("click", copyUPI);
    }
});


// =================================================================
// ROYAL STRIKERS — Premium Interactivity (Unified, De-duplicated)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── 1. Lenis Smooth Scroll (desktop + non-reduced-motion only) ──
    if (!isTouchDevice && !prefersReducedMotion) {
        new Lenis({
            autoRaf: true,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
        });
    }

    // ── 2. Magnetic Trailing Cursor (desktop only) ──
    const cursor = document.getElementById('customCursor');
    if (cursor && !isTouchDevice) {
        let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0, isHovering = false;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!cursor.style.display || cursor.style.display === 'none') cursor.style.display = 'block';
        });

        // RAF loop — cursor lags behind mouse with lerp (0.15 = snappy but smooth)
        const tickCursor = () => {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) scale(${isHovering ? 2.5 : 1})`;
            requestAnimationFrame(tickCursor);
        };
        tickCursor();

        document.querySelectorAll('a, button, .btn, .editorial-block, input, select, textarea').forEach(el => {
            el.addEventListener('mouseenter', () => {
                isHovering = true;
                cursor.style.mixBlendMode = 'difference';
                cursor.style.backgroundColor = 'white';
                cursor.style.border = 'none';
            });
            el.addEventListener('mouseleave', () => {
                isHovering = false;
                cursor.style.mixBlendMode = 'normal';
                cursor.style.backgroundColor = 'transparent';
                cursor.style.border = '1px solid var(--gold-primary)';
            });
        });
    }

    // ── 3. Cinematic Preloader with Video Detection ──
    const loadingBar = document.getElementById('preloader-bar');
    const preloaderWrap = document.getElementById('preloader');
    const desktopVideo = document.querySelector('.hero-video-desktop');
    const mobileVideo = document.querySelector('.hero-video-mobile');
    let activeVideo = null;

    if (desktopVideo && window.getComputedStyle(desktopVideo).display !== 'none') {
        activeVideo = desktopVideo;
    } else if (mobileVideo) {
        activeVideo = mobileVideo;
    }

    if (loadingBar && preloaderWrap) {
        let isLoaded = false;

        const finishPreloader = () => {
            if (isLoaded) return;
            isLoaded = true;

            animate(loadingBar, { width: '100%' }, { duration: 0.3, ease: 'easeOut' }).then(() => {
                setTimeout(() => {
                    animate('#preloader-text', { opacity: 0, scale: 1.1, filter: 'blur(4px)' }, { duration: 0.6, ease: 'easeIn' });
                    animate(preloaderWrap, { opacity: 0 }, { duration: 0.8, delay: 0.2, ease: 'easeInOut' }).then(() => {
                        preloaderWrap.style.display = 'none';

                        if (activeVideo) activeVideo.play().catch(() => {});

                        // Hero video cinematic scale-down 1.1x → 1.0x
                        if (!prefersReducedMotion) {
                            animate('.hero-video', { scale: [1.1, 1], filter: ['blur(4px)', 'blur(0px)'] }, { duration: 1.5, ease: 'easeOut' });
                        }

                        // Staggered mask-text reveal
                        const maskTexts = document.querySelectorAll('.mask-text');
                        if (maskTexts.length > 0 && !prefersReducedMotion) {
                            animate(maskTexts, { y: ['100%', '0%'] }, { duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: stagger(0.15) });
                        } else {
                            maskTexts.forEach(el => { el.style.transform = 'translateY(0)'; });
                        }

                        animate('.scroll-indicator-wrapper', { opacity: [0, 0.8] }, { duration: 1, delay: 0.8 });
                    });
                }, 1000);
            });
        };

        if (!prefersReducedMotion) {
            animate(loadingBar, { width: ['0%', '90%'] }, { duration: 5.0, ease: 'circOut' });
        } else {
            loadingBar.style.width = '90%';
        }

        setTimeout(finishPreloader, 5000);

        if (activeVideo) {
            if (activeVideo.readyState >= 3) {
                finishPreloader();
            } else {
                activeVideo.addEventListener('canplay', finishPreloader, { once: true });
            }
        } else {
            setTimeout(finishPreloader, 2000);
        }
    }

    // ── 4. Scroll-Linked Parallax ──
    if (!prefersReducedMotion) {
        const heroVideoEl = document.querySelector('.hero-video');
        const heroSection = document.querySelector('.hero');
        if (heroVideoEl && heroSection) {
            scroll(animate(heroVideoEl, { y: ['0%', '30%'] }), {
                target: heroSection,
                offset: ['start start', 'end start']
            });
        }

        document.querySelectorAll('.img-wrapper img').forEach(img => {
            scroll(animate(img, { y: ['-10%', '10%'] }), {
                target: img.parentElement,
                offset: ['start end', 'end start']
            });
        });
    }

    // ── 5. inView Scroll Triggers ──
    inView('.editorial-block', (el) => {
        animate(el, { opacity: [0, 1], y: [50, 0] }, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    }, { margin: '-100px' });

    inView('section .title', (el) => {
        animate(el, { opacity: [0, 1], x: [-30, 0] }, { duration: 0.8, ease: 'easeOut' });
    }, { margin: '-50px' });

    // ── 6. Cinematic Page Transitions ──
    const transitionEl = document.getElementById('page-transition');
    if (transitionEl) {
        animate(transitionEl, { y: ['0%', '-100%'] }, { duration: 0.8, ease: [0.76, 0, 0.24, 1] }).then(() => {
            transitionEl.style.display = 'none';
        });

        document.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('http') && !anchor.hasAttribute('target')) {
                    e.preventDefault();
                    transitionEl.style.display = 'block';
                    animate(transitionEl, { y: ['100%', '0%'] }, { duration: 0.6, ease: [0.76, 0, 0.24, 1] }).then(() => {
                        window.location.href = href;
                    });
                }
            });
        });
    }

    // ── 7. Spotlight Cards ──
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--x', (e.clientX - rect.left) + 'px');
            card.style.setProperty('--y', (e.clientY - rect.top) + 'px');
        });
    });

    // ── 8. 3D Tilt Gallery (desktop only) ──
    if (!isTouchDevice) {
        document.querySelectorAll('.gallery-grid img, .sport-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const rotateX = (((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2)) * -10;
                const rotateY = (((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2)) * 10;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });
    }

    // ── 9. Framer Motion Spring Bounce on Primary Buttons (NEW) ──
    if (!isTouchDevice && !prefersReducedMotion) {
        document.querySelectorAll('.btn.primary, .submit-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                animate(btn, { scale: 1.06 }, { type: 'spring', stiffness: 400, damping: 15 });
            });
            btn.addEventListener('mouseleave', () => {
                animate(btn, { scale: 1 }, { type: 'spring', stiffness: 300, damping: 20 });
            });
        });
    }
});

// =================================================================
// 6. SCROLL REVEAL ANIMATIONS (Intersection Observer)
// =================================================================
(function initScrollReveals() {
    const reveals = document.querySelectorAll(".reveal");
    if (reveals.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                // Optional: Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: "0px 0px -50px 0px",
        threshold: 0.1
    });

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
})();

