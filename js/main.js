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

    /**
     * Calculates age in years from a Date of Birth.
     * @param {Date} dob
     * @returns {number}
     */
    function calculateAge(dob) {
        var today = new Date();
        var age = today.getFullYear() - dob.getFullYear();
        var m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    /**
     * Maps a numeric age to the tournament age category.
     * Must match the <option> values in register.html.
     * @param {number} age
     * @returns {string}
     */
    function getAgeCategory(age) {
        if (age < 9)  return 'Under 9';
        if (age < 12) return 'Under 12';
        if (age < 16) return 'Under 16';
        if (age < 19) return 'Under 19';
        return 'Open';
    }

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
            if (year > 1920 && year < 2025 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                return new Date(year, month, day);
            }
        }

        // Pattern 2: Year of Birth only (some Aadhaar cards show only year)
        var yobMatch = text.match(/(?:year|yob|birth)[:\s]*(\d{4})/i);
        if (yobMatch) {
            var y = parseInt(yobMatch[1], 10);
            if (y > 1920 && y < 2025) {
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
            status.innerHTML = '<span class="warning">📄 PDF uploaded — please select age category manually.</span>';
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

            var dob = extractDOB(text);

            if (dob) {
                var age = calculateAge(dob);
                if (age >= 1 && age <= 100) {
                    var category = getAgeCategory(age);
                    document.getElementById('ageCategory').value = category;
                    status.innerHTML = '<span class="verified">✅ Age detected: ' + age + ' years → Auto-selected: ' + category + '</span>';
                } else {
                    status.innerHTML = '<span class="warning">⚠️ Could not determine valid age. Please select category manually.</span>';
                }
            } else {
                status.innerHTML = '<span class="warning">⚠️ Could not read date of birth. Please select age category manually.</span>';
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.warn('Aadhaar OCR error:', err);
            status.innerHTML = '<span class="warning">⚠️ Auto-verification unavailable. Please select age category manually.</span>';
        }
    });
})();


// ────────────────────────────────────────────────────────────────
// 4. FORM SUBMISSION — Web3Forms API + UPI REDIRECT
//    Silently sends all registration data (including Aadhaar file)
//    to the Web3Forms dashboard / email, then launches the UPI
//    payment intent. Shows a manual UPI fallback for desktop.
// ────────────────────────────────────────────────────────────────
(function initFormSubmission() {
    var form      = document.getElementById('registerForm');
    var submitBtn = document.getElementById('submitBtn');
    var fallback  = document.getElementById('paymentFallback');

    // Only run on register page
    if (!form || !submitBtn) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Extra phone validation (pattern attr may not fire on all browsers)
        var phone = document.getElementById('phone').value;
        if (!/^\d{10}$/.test(phone)) {
            showToast('Please enter a valid 10-digit phone number.', 'error');
            document.getElementById('phone').focus();
            return;
        }

        // Show loading state
        submitBtn.disabled  = true;
        submitBtn.innerHTML = '<span class="btn-spinner"></span> Submitting...';

        try {
            var formData = new FormData(form);

            var response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            var result = await response.json();

            if (result.success) {
                showToast('Registration submitted! Redirecting to payment...', 'success');

                // Brief delay so the user reads the success toast
                setTimeout(function () {
                    window.location.href =
                        'upi://pay?pa=8296398607@ptaxis&pn=Royal%20Strikers&cu=INR';

                    // If UPI app didn't open (desktop), show manual fallback
                    if (fallback) {
                        setTimeout(function () {
                            fallback.style.display = 'block';
                            showToast('If payment app didn\'t open, use the UPI ID shown below.', 'info');
                        }, 2000);
                    }
                }, 1500);

            } else {
                showToast('Submission failed: ' + (result.message || 'Unknown error. Please try again.'), 'error');
                submitBtn.disabled  = false;
                submitBtn.innerHTML = 'Register &amp; Pay';
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showToast('Network error. Please check your connection and try again.', 'error');
            submitBtn.disabled  = false;
            submitBtn.innerHTML = 'Register &amp; Pay';
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
