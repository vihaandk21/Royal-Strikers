(function () {
    // 1. Toast Notification
    function showToast(message, type) {
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        setTimeout(function () {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }

    // Number to words converter for INR
    function numberToWordsINR(num) {
        if (num === 0) return 'Zero';
        var a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if ((num = num.toString()).length > 9) return 'overflow';
        var n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return;
        var str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str.trim();
    }

    // Receipt Generation
    async function generateReceipt(currentAmount) {
        var wrapper = document.getElementById('receiptWrapper');

        document.getElementById('r-name').textContent = document.getElementById('fullName').value;
        document.getElementById('r-phone').textContent = document.getElementById('phone').value;
        var teamNameInput = document.getElementById('teamName');
        if (teamNameInput && document.getElementById('r-teamName')) {
            document.getElementById('r-teamName').textContent = teamNameInput.value || 'N/A';
        }
        document.getElementById('r-level').textContent = document.getElementById('level').value;
        document.getElementById('r-amount').textContent = '₹' + currentAmount;
        document.getElementById('r-txn').textContent = document.getElementById('transactionId').value;

        var now = new Date();
        var receiptNo = 'RS-' + now.getFullYear() + '-' + String(Date.now()).slice(-6);
        document.getElementById('r-receiptNo').textContent = receiptNo;

        // Amount in words
        var wordsEl = document.getElementById('r-amountWords');
        if(wordsEl) {
            wordsEl.textContent = 'Rupees ' + numberToWordsINR(currentAmount) + ' Only';
        }

        // Hide discount row for fast receipt
        var baseFeeRow = document.getElementById('r-baseFeeRow');
        var discountRow = document.getElementById('r-discountRow');
        if(baseFeeRow) baseFeeRow.style.display = 'none';
        if(discountRow) discountRow.style.display = 'none';

        document.getElementById('r-date').textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        wrapper.style.left = '0px';
        wrapper.style.top = '0px';
        wrapper.style.zIndex = '-100'; 

        try {
            await new Promise(resolve => setTimeout(resolve, 100)); 
            var canvas = await html2canvas(document.getElementById('receiptCaptureBox') || document.getElementById('receipt'), {
                scale: 2,
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

    // Log Registration (best-effort, non-blocking)
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
            console.error('Registration logging failed:', e);
        }
    }

    var form = document.getElementById('registerForm');
    if(form) {
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
                showToast('Please enter a valid 12-digit UPI Transaction ID (UTR number).', 'error');
                document.getElementById('transactionId').focus();
                return;
            }

            var submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-spinner"></span> Finalizing Registration...';

            var currentAmount = Number(document.getElementById('amountField').value) || 0;

            try {
                var formData = new FormData(form);
                
                // Construct basic WhatsApp msg
                var waMessage = `*NEW FAST REGISTRATION*\n\n`;
                waMessage += `*Team:* ${formData.get('teamName')}\n`;
                waMessage += `*Captain:* ${formData.get('fullName')}\n`;
                waMessage += `*Phone:* ${formData.get('phone')}\n`;
                waMessage += `*Category:* ${formData.get('teamGender')} - ${formData.get('level')}\n`;
                waMessage += `*Amount Paid:* ₹${currentAmount}\n`;
                waMessage += `*Transaction ID:* ${txn}\n\n`;
                
                formData.set('Full Registration Details', waMessage);
                formData.set('teamSize', '0'); // To satisfy backend if needed

                // Log to Firebase/Restful API
                logRegistration({
                    timestamp: Date.now(),
                    teamName: formData.get('teamName') || 'N/A',
                    captainName: formData.get('fullName') || 'N/A',
                    phone: formData.get('phone') || 'N/A',
                    teamGender: formData.get('teamGender') || 'N/A',
                    level: formData.get('level') || 'N/A',
                    teamSize: 0,
                    transactionId: txn,
                    baseAmount: currentAmount,
                    discountAmount: 0,
                    amountPaid: currentAmount,
                    couponCode: null,
                    roster: []
                });

                // Submit to Web3Forms
                var response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });
                var result = await response.json();

                if (result.success) {
                    showToast('Registration successful! Downloading receipt...', 'success');
                    await generateReceipt(currentAmount);

                    waMessage += `*(Please find attached my downloaded receipt)*`;
                    var waUrl = "https://api.whatsapp.com/send?phone=918296398607&text=" + encodeURIComponent(waMessage);

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '✅ Receipt Downloaded';
                    submitBtn.style.opacity = '0.7';
                    submitBtn.style.cursor = 'default';

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
    }
})();
