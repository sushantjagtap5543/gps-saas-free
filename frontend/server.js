const http = require('http');

const PORT = process.env.PORT || 3000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GPS Free SaaS - Zero Cost GPS Tracking</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            padding: 40px 20px;
        }
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        .card h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
            margin: 10px 0;
        }
        .status-badge.loading {
            background: #f59e0b;
        }
        .status-badge.error {
            background: #ef4444;
        }
        .link-list {
            list-style: none;
            margin-top: 15px;
        }
        .link-list li {
            margin: 10px 0;
        }
        .link-list a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: color 0.2s;
        }
        .link-list a:hover {
            color: #764ba2;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        .feature-item {
            text-align: center;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
        }
        .feature-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .feature-label {
            color: #6b7280;
            font-size: 0.9em;
        }
        .port-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        .port-info strong {
            color: #667eea;
        }
        footer {
            text-align: center;
            color: white;
            margin-top: 60px;
            opacity: 0.8;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 2em; }
            .feature-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗺️ GPS Free SaaS</h1>
            <p>Self-Hosted GPS Tracking Platform • Zero API Costs • Unlimited Devices</p>
        </div>

        <div class="grid">
            <div class="card">
                <h2>📡 System Status</h2>
                <div id="status">
                    <span class="status-badge loading">⏳ Checking...</span>
                </div>
                <p style="margin-top: 15px; color: #6b7280;">
                    Backend API is running and ready to receive GPS device data.
                </p>
            </div>

            <div class="card">
                <h2>🔗 Quick Links</h2>
                <ul class="link-list">
                    <li><a href="${API_URL}/api/docs" target="_blank">
                        📚 API Documentation →
                    </a></li>
                    <li><a href="${API_URL}/health" target="_blank">
                        💓 Health Check →
                    </a></li>
                    <li><a href="#" onclick="checkStatus(); return false;">
                        🔄 Refresh Status
                    </a></li>
                </ul>
            </div>

            <div class="card">
                <h2>🚀 Quick Start</h2>
                <ol style="padding-left: 20px; color: #4b5563; line-height: 1.8;">
                    <li>Access API docs above</li>
                    <li>Add your GPS device</li>
                    <li>Configure device settings</li>
                    <li>Start tracking!</li>
                </ol>
            </div>

            <div class="card">
                <h2>📍 GPS Device Ports</h2>
                <div class="port-info">
                    <p><strong>GT06 Protocol:</strong> Port 5000</p>
                    <p style="margin-top: 8px;"><strong>TK103 Protocol:</strong> Port 5001</p>
                    <p style="margin-top: 8px;"><strong>H02 Protocol:</strong> Port 5002</p>
                </div>
                <p style="margin-top: 15px; color: #6b7280; font-size: 0.9em;">
                    Configure your GPS device to send data to your server IP using one of these ports.
                </p>
            </div>

            <div class="card" style="grid-column: 1 / -1;">
                <h2>✨ Platform Features</h2>
                <div class="feature-grid">
                    <div class="feature-item">
                        <div class="feature-value">$0</div>
                        <div class="feature-label">Monthly API Costs</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-value">100%</div>
                        <div class="feature-label">Self-Hosted</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-value">∞</div>
                        <div class="feature-label">Device Limit</div>
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>Built with ❤️ for the open-source community</p>
            <p style="margin-top: 10px;">No paid APIs • Completely Free • Self-Hosted</p>
        </footer>
    </div>

    <script>
        async function checkStatus() {
            const statusEl = document.getElementById('status');
            statusEl.innerHTML = '<span class="status-badge loading">⏳ Checking...</span>';
            
            try {
                const response = await fetch('${API_URL}/health');
                const data = await response.json();
                
                if (data.status === 'ok') {
                    statusEl.innerHTML = '<span class="status-badge">✓ Online</span>';
                } else {
                    statusEl.innerHTML = '<span class="status-badge error">⚠ Issues Detected</span>';
                }
            } catch (error) {
                statusEl.innerHTML = '<span class="status-badge error">✗ Offline</span>';
            }
        }
        
        // Check status on page load
        window.addEventListener('load', checkStatus);
    </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
    });
    res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║        🌐 GPS Free SaaS Frontend Running              ║
╠════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                         ║
║  API URL:  ${API_URL}               ║
╚════════════════════════════════════════════════════════╝
    `);
});
