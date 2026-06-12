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
    var aadhaarInput = document.getElementById('aadhaar');
    var status       = document.getElementById('verificationStatus');

    // Only run on register page
    if (!aadhaarInput || !status) return;

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
        var fullDate = text.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
        if (fullDate) {
            var day   = parseInt(fullDate[1], 10);
            var month = parseInt(fullDate[2], 10) - 1;
            var year  = parseInt(fullDate[3], 10);
            if (year > 1920 && year < 2027 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                return new Date(year, month, day);
            }
        }

        // Pattern 2: Year of Birth only (some Aadhaar cards show only year)
        var yobMatch = text.match(/(?:year|yob|birth)[:\s]*(\d{4})/i);
        if (yobMatch) {
            var y = parseInt(yobMatch[1], 10);
            if (y > 1920 && y < 2027) {
                return new Date(y, 0, 1);
            }
        }

        return null;
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
            var imageUrl = URL.createObjectURL(file);

            var ocrPromise = loadAndRunOCR(imageUrl);
            var text = await Promise.race([ocrPromise, timeoutPromise]);
            clearTimeout(timeoutId);
            URL.revokeObjectURL(imageUrl);

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
                    status.innerHTML = '<span class="warning">⚠️ Could not determine valid age. We will verify manually via WhatsApp.</span>';
                }
            } else {
                status.innerHTML = '<span class="warning">⚠️ Could not read date of birth. We will verify manually via WhatsApp. (Check console for raw output)</span>';
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.warn('Aadhaar OCR error:', err);
            status.innerHTML = '<span class="warning">⚠️ Auto-verification unavailable. We will verify manually via WhatsApp.</span>';
        }
    });
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

    if (!form) return;

    var currentAmount = 0;

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

        // Ensure visible for html2canvas
        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        wrapper.style.left = '0px';
        wrapper.style.top = '0px';
        wrapper.style.zIndex = '-100'; // keep behind

        try {
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
            
            // Web3Forms Free Tier blocks file uploads. 
            // We remove the files from the payload since the user will send them via WhatsApp instead.
            formData.delete('aadhaar');
            formData.delete('schoolId');

            var response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            var result = await response.json();

            if (result.success) {
                showToast('Registration successful! Downloading receipt and opening WhatsApp...', 'success');
                await generateReceipt();

                // Prepare WhatsApp Message
                var waMessage = "Hello Royal Strikers! I have registered for the tournament.\n\n" +
                    "Name: " + document.getElementById('fullName').value + "\n" +
                    "Phone: " + document.getElementById('phone').value + "\n" +
                    "Team Name: " + (document.getElementById('teamName') ? document.getElementById('teamName').value : 'N/A') + "\n" +
                    "Level: " + document.getElementById('level').value + "\n" +
                    "Transaction ID: " + document.getElementById('transactionId').value + "\n\n" +
                    "*(Please find attached my downloaded receipt, along with my Aadhaar/School ID proofs)*";
                
                var waUrl = "https://api.whatsapp.com/send?phone=918296398607&text=" + encodeURIComponent(waMessage);

                // Open WhatsApp after a short delay so the receipt can download
                setTimeout(function() {
                    window.open(waUrl, '_blank');
                }, 1500);

                // Keep button disabled to prevent double submission
                submitBtn.innerHTML = '✅ Registration Complete';
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
