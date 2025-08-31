document.addEventListener('DOMContentLoaded', () => {
    const scanTab = document.getElementById('scan-tab');
    const generateTab = document.getElementById('generate-tab');
    const scannerSection = document.getElementById('scanner-section');
    const generatorSection = document.getElementById('generator-section');

    const startScanBtn = document.getElementById('start-scan-btn');
    const scannerContainer = document.getElementById('scanner-container');
    const video = document.getElementById('qr-video');
    const scanResultContainer = document.getElementById('scan-result-container');
    const scanResult = document.getElementById('scan-result');
    const copyBtn = document.getElementById('copy-btn');

    const qrTextInput = document.getElementById('qr-text');
    const generateBtn = document.getElementById('generate-btn');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const qrcodeEl = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('download-btn');

    let qrCodeInstance = null;
    let scanning = false;
    let stream = null;

    // Tab switching logic
    scanTab.addEventListener('click', () => {
        scanTab.classList.add('active-tab');
        generateTab.classList.remove('active-tab');
        scannerSection.classList.remove('hidden');
        generatorSection.classList.add('hidden');
        stopScan();
    });

    generateTab.addEventListener('click', () => {
        generateTab.classList.add('active-tab');
        scanTab.classList.remove('active-tab');
        generatorSection.classList.remove('hidden');
        scannerSection.classList.add('hidden');
        stopScan();
    });

    // --- QR Code Generator Logic ---
    generateBtn.addEventListener('click', () => {
        const text = qrTextInput.value.trim();
        if (text) {
            qrcodeEl.innerHTML = ''; // Clear previous QR code
            if (qrCodeInstance) {
                qrCodeInstance.clear();
            }
            qrCodeInstance = new QRCode(qrcodeEl, {
                text: text,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            qrcodeContainer.classList.remove('hidden');
        } else {
            alert('Please enter text or a URL.');
        }
    });

    downloadBtn.addEventListener('click', () => {
        const canvas = qrcodeEl.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
            alert('Generate a QR code first!');
        }
    });

    // --- QR Code Scanner Logic ---
    startScanBtn.addEventListener('click', () => {
        if (scanning) {
            stopScan();
        } else {
            startScan();
        }
    });

    function startScan() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(s => {
                stream = s;
                video.srcObject = stream;
                video.setAttribute('playsinline', true); // Required for iOS
                video.play();
                scanning = true;
                startScanBtn.innerHTML = '<i class="fa-solid fa-stop mr-2"></i> Stop Scan';
                startScanBtn.classList.add('bg-red-600', 'hover:bg-red-700');
                startScanBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                scannerContainer.classList.remove('hidden');
                scanResultContainer.classList.add('hidden');
                requestAnimationFrame(tick);
            })
            .catch(err => {
                console.error('Camera Error:', err);
                alert('Could not access the camera. Please ensure you have given permission.');
            });
    }

    function stopScan() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        scanning = false;
        video.srcObject = null;
        startScanBtn.innerHTML = '<i class="fa-solid fa-camera mr-2"></i> Start Camera Scan';
        startScanBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        startScanBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        scannerContainer.classList.add('hidden');
    }

    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA && scanning) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                stopScan();
                scanResult.textContent = code.data;
                scanResultContainer.classList.remove('hidden');
                // Vibrate for feedback on mobile
                if ('vibrate' in navigator) {
                    navigator.vibrate(200);
                }
            } else {
                requestAnimationFrame(tick);
            }
        }
        if (scanning) {
            requestAnimationFrame(tick);
        }
    }

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(scanResult.textContent).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-copy mr-2"></i> Copy';
            }, 2000);
        });
    });
});