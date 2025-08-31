document.addEventListener('DOMContentLoaded', () => {
    // Tab elements
    const scanTabBtn = document.getElementById('scan-tab-btn');
    const generateTabBtn = document.getElementById('generate-tab-btn');
    const scannerContent = document.getElementById('scanner-content');
    const generatorContent = document.getElementById('generator-content');

    // Scanner elements
    const video = document.getElementById('qr-video');
    const loadingMessage = document.getElementById('loading-message');
    const canvasElement = document.getElementById('qr-canvas');
    const canvas = canvasElement.getContext('2d');
    const scanResultContainer = document.getElementById('scan-result-container');
    const scanResult = document.getElementById('scan-result');
    const copyBtn = document.getElementById('copy-btn');
    let stream = null;

    // Generator elements
    const qrTextInput = document.getElementById('qr-text');
    const qrcodeContainer = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('download-btn');
    let qrcode = null;
    let debounceTimer;

    // --- Tab Switching Logic ---
    function switchTab(activeTab) {
        if (activeTab === 'scan') {
            scanTabBtn.classList.add('active');
            generateTabBtn.classList.remove('active');
            scannerContent.classList.remove('hidden');
            generatorContent.classList.add('hidden');
            startScanner();
        } else {
            generateTabBtn.classList.add('active');
            scanTabBtn.classList.remove('active');
            generatorContent.classList.remove('hidden');
            scannerContent.classList.add('hidden');
            stopScanner();
            // Generate a default QR if input is empty
            if (qrTextInput.value.trim() === '' && !qrcode) {
                generateQRCode('https://seron.dev');
            }
        }
    }

    scanTabBtn.addEventListener('click', () => switchTab('scan'));
    generateTabBtn.addEventListener('click', () => switchTab('generate'));

    // --- QR Code Scanner Logic ---
    async function startScanner() {
        if (stream) return; // Already running
        scanResultContainer.classList.add('hidden');
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            video.setAttribute('playsinline', true); // Required for iOS
            video.play();
            loadingMessage.style.display = 'none';
            requestAnimationFrame(tick);
        } catch (err) {
            console.error("Error accessing camera: ", err);
            loadingMessage.style.display = 'flex';
        }
    }

    function stopScanner() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    function tick() {
        if (!stream) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                scanResult.textContent = code.data;
                scanResultContainer.classList.remove('hidden');
                stopScanner(); // Stop camera after successful scan
                navigator.vibrate?.(200); // Vibrate on success if supported
            } else {
                requestAnimationFrame(tick);
            }
        } else {
            requestAnimationFrame(tick);
        }
    }

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(scanResult.textContent).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 1500);
        });
    });

    // --- QR Code Generator Logic ---
    function generateQRCode(text) {
        qrcodeContainer.innerHTML = ''; // Clear previous QR code
        if (!text) {
            downloadBtn.disabled = true;
            return;
        }
        if (qrcode) {
            qrcode.makeCode(text);
        } else {
            qrcode = new QRCode(qrcodeContainer, {
                text: text,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        downloadBtn.disabled = false;
    }

    qrTextInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const text = qrTextInput.value.trim();
            generateQRCode(text);
        }, 250); // Debounce for 250ms
    });

    downloadBtn.addEventListener('click', () => {
        const img = qrcodeContainer.querySelector('img');
        if (img) {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // --- Initial State ---
    switchTab('scan'); // Start with the scanner tab active
});