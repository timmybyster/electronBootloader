const electron = require('electron');
const { app, BrowserWindow } = electron;
const path = require('path');
const url = require('url');
const { autoUpdater } = require("electron-updater");

const comms = require('./commsHandler');
const hexParser = require('./hexParser');
const flashParser = require('./flashParser');

var winHeight = 600, winWidth = 900;
var windowState = true;

//require('electron-reload')(__dirname)

let win;
function createWindow() {
    //Create brower window
    win = new BrowserWindow({ width: winWidth, height: winHeight, icon: __dirname + '/etc/img/XavantIco.png', frame: false }); //frame: null
    win.setMenu(null);
    win.maximize();

    // Load index.html
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/etc/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    //win.setMenu(null);

    // Open devtools
    //npm rwin.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', function () {
//    autoUpdater.checkForUpdates();
    createWindow();
});

//autoUpdater.on('checking-for-update', () => {
//    console.log("checkingForUpdates");
//});

//autoUpdater.on('update-available', (info) => {
//});

//autoUpdater.on('update-downloaded', (info) => {
//    console.log(info);
//    autoUpdater.quitAndInstall();
//});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

var ipc = electron.ipcMain;

var hexFileName;

ipc.on('resetAction', function (event, data) {
    hexFileName = data;
    comms.initialise(function (err, result) {
        if (err) {
            event.sender.send('commsFail', err);
        }
        else {
            event.sender.send('commsSuccess', result);
        }
    });
    event.sender.send('windowState', windowState);
});

ipc.on('readAction', function (event, data) {
    comms.read(function (err, result) {
        if (err) {
            event.sender.send('readFail', err);
        }
        else {
            flashParser.createFlashObject(result, (err, parsedData) => {

            });
            event.sender.send('readSuccess', "");
        }
    });
});

ipc.on('uploadAction', function (event, data) {
    var fs = require('fs');

    var dir = './blocks';
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    
    hexParser.parse(hexFileName, function (err, result) {
        if (err) {
            event.sender.send('uploadFailed', 'Failed');
        }
        else {
            comms.info(result, function (err, result) {
                if (err) {
                    event.sender.send('uploadFailed', 'Failed');
                }
                else {
                    console.log(result);
                    if (result.thisCrc == result.deviceCrc && result.thisBlocks == result.deviceBlocks) {
                        console.log("Latest Version");
                        comms.boot(function (err, result) {
                            if (err) {
                                event.sender.send('bootFail', err);
                            }
                            else {
                                event.sender.send('bootSuccess', result);
                            }
                        });
                    }
                    else {
                        event.sender.send('uploadResponse', "Estimated Upload Time: " + Math.round(result / 2) + " seconds");
                    }
                }
            });
        }
    });
});


ipc.on('writeAction', function (event, data) {
    comms.write((err, res) => {
        if (err) {
            event.sender.send('writeFail', err);
        }
        else {
            event.sender.send('writeReply', res);
        }
    });
});

ipc.on('verifyAction', function (event, data) {
    comms.verify((err, res) => {
        if (err) {
            event.sender.send('verifyFail', err);
        }
        else {
            event.sender.send('verifyReply', res);
        }
    });
});

ipc.on('bootAction', function (event, data) {
    console.log("boot");
    comms.boot(function (err, result) {
        if (err) {
            event.sender.send('bootFail', err);
        }
        else {
            event.sender.send('bootSuccess', result);
        }
    });
});

ipc.on('closeAction', function (event, data) {
    app.quit();
});

ipc.on('minimizeAction', function (event, data) {
    win.minimize();
});

ipc.on('maximizeAction', function (event, data) {
    win.getSize(winWidth, winHeight);
    win.maximize();
    windowState = true;
});

ipc.on('unmaximizeAction', function (event, data) {
    windowState = false;
    win.setSize(winWidth, winHeight, true);
});
