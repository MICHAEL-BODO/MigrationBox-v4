const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const net = require('net');

let mainWindow;
let serverProcess;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    console.log(`Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);
  } else {
    // In production, start the standalone server
    // Path structure: app.asar/electron/standalone/frontend/desktop/server.js
    // Note: The path might vary depending on monorepo structure.
    // Based on inspection: electron/standalone/frontend/desktop/server.js
    let serverPath = path.join(__dirname, 'standalone/frontend/desktop/server.js');

    // Handle ASAR unpacking
    if (serverPath.includes('app.asar')) {
        serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
    }

    console.log(`Starting server from: ${serverPath}`);

    getFreePort().then(port => {
        console.log(`Selected port: ${port}`);

        serverProcess = fork(serverPath, [], {
          env: {
            ...process.env,
            PORT: port,
            NODE_ENV: 'production',
            HOSTNAME: 'localhost'
          },
          stdio: 'inherit'
        });

        serverProcess.on('error', (err) => {
          console.error('Server process error:', err);
        });

        const loadApp = () => {
          mainWindow.loadURL(`http://localhost:${port}`).catch(err => {
            console.log(`Server not ready at port ${port}, retrying...`);
            setTimeout(loadApp, 500);
          });
        };

        // Initial delay
        setTimeout(loadApp, 500);

    }).catch(err => {
        console.error('Failed to get free port:', err);
    });
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
