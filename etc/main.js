var ipc = require('electron').ipcRenderer;
reset();

ipc.once("commsSuccess", function (event, data) {
    var version = document.getElementById('version');
    version.innerHTML = JSON.stringify(data);
    read();

});

ipc.once("commsFail", function (event, data) {
    var version = document.getElementById('version');
    console.log(data);
    version.innerHTML = "Connect Device";
});

ipc.once('readSuccess', function (event, response) {
    start();
})

ipc.once('uploadResponse', function (event, response) {
    nextWriteFunction();
})

ipc.once('uploadFailed', function (event, response) {
    nextWriteFunction();
})

ipc.on('writeFail', function (event, failureMessage) {
    var progressValue = document.getElementById('progressBarValue');
    var progressRight = document.getElementById('progressBarRight');
    var progressLeft = document.getElementById('progressBarLeft');
    progressValue.innerHTML = failureMessage;
    progressValue.style.color = "crimson";
    progressRight.style.borderColor = "crimson";
    progressLeft.style.borderColor = "crimson";
});

ipc.on('writeReply', function (event, progressPercent) {
    var progressValue = document.getElementById('progressBarValue');
    progressValue.innerHTML = "";
    progressValue.innerHTML += progressPercent + "%";
    var progressRight = document.getElementById('progressBarRight');
    var progressLeft = document.getElementById('progressBarLeft');
    if (progressPercent <= 50) {
        var deg = "rotate(";
        deg += progressPercent * 3.6;
        deg += "deg)";
        progressRight.style.transform = deg;
        progressLeft.style.transform = "rotate(0deg)";
        progressValue.style.color = "#54d0dd";
        progressRight.style.borderColor = "#54d0dd";
        progressLeft.style.borderColor = "#54d0dd";
    }
    else if (progressPercent <= 100) {
        var deg = "rotate(";
        deg += (progressPercent * 3.6) - 180;
        deg += "deg)";
        progressLeft.style.transform = deg;
        progressRight.style.transform = "rotate(180deg)";
        progressValue.style.color = "#54d0dd";
        progressRight.style.borderColor = "#54d0dd";
        progressLeft.style.borderColor = "#54d0dd";
    }
    else if (progressPercent == "Success") {
        progressRight.style.transform = "rotate(180deg)";
        progressLeft.style.transform = "rotate(180deg)";
        progressValue.innerHTML = progressPercent;
        progressValue.style.color = "#2ECC71";
        progressRight.style.borderColor = "#2ECC71";
        progressLeft.style.borderColor = "#2ECC71";
        ipc.send('verifyAction', "");
    }
});

ipc.on('verifyFail', function (event, failureMessage) {
    var progressValue = document.getElementById('verifyBarValue');
    var progressRight = document.getElementById('verifyBarRight');
    var progressLeft = document.getElementById('verifyBarLeft');
    progressValue.innerHTML = failureMessage;
    progressValue.style.color = "crimson";
    progressRight.style.borderColor = "crimson";
    progressLeft.style.borderColor = "crimson";
});

ipc.on('verifyReply', function (event, progressPercent) {
    var progressValue = document.getElementById('verifyBarValue');
    progressValue.innerHTML = "";
    progressValue.innerHTML += progressPercent + "%";
    var progressRight = document.getElementById('verifyBarRight');
    var progressLeft = document.getElementById('verifyBarLeft');
    if (progressPercent <= 50) {
        var deg = "rotate(";
        deg += progressPercent * 3.6;
        deg += "deg)";
        progressRight.style.transform = deg;
        progressLeft.style.transform = "rotate(0deg)";
        progressValue.style.color = "#54d0dd";
        progressRight.style.borderColor = "#54d0dd";
        progressLeft.style.borderColor = "#54d0dd";

    }
    else if (progressPercent <= 100) {
        var deg = "rotate(";
        deg += (progressPercent * 3.6) - 180;
        deg += "deg)";
        progressRight.style.transform = "rotate(180deg)";
        progressLeft.style.transform = deg;
        progressValue.style.color = "#54d0dd";
        progressRight.style.borderColor = "#54d0dd";
        progressLeft.style.borderColor = "#54d0dd";
    }
    else if (progressPercent == "Success") {
        progressLeft.style.transform = "rotate(180deg)";
        progressRight.style.transform = "rotate(180deg)";
        progressValue.innerHTML = progressPercent;
        progressValue.style.color = "#2ECC71";
        progressRight.style.borderColor = "#2ECC71";
        progressLeft.style.borderColor = "#2ECC71";
        ipc.send('bootAction', "");
    }
});

ipc.on('bootFail', function (event, failureMessage) {

});

ipc.on('bootSuccess', function (event, response) {
    var writeHeader = document.getElementById('writeHeader');
    writeHeader.style.display = "none";
    var writeHeader = document.getElementById('uploadHeader');
    writeHeader.style.display = "none";
    var successHeader = document.getElementById('successHeader');
    successHeader.style.display = "block";
});

ipc.once("windowState", function (event, data) {
    var maximize = document.getElementById('maximize');
    if (data == true) {
        maximize.innerHTML = "unmaximize";
        maximize.onclick = unmaximizeFunction;
    }
    else {
        maximize.innerHTML = "maximize";
        maximize.onclick = maximizeFunction;
    }
});

function reset() {
    ipc.send('resetAction', 'someData');
}

function read() {
    ipc.send('readAction', 'read');
}

function start() {
    var startHeader = document.getElementById("startHeader");
    startHeader.style.display = "none";
    var uploadHeader = document.getElementById("uploadHeader");
    uploadHeader.style.display = "block";
    ipc.send('uploadAction', "");
}

function nextWriteFunction() {
    var uploadHeader = document.getElementById("uploadHeader");
    uploadHeader.style.display = "none";
    var writeHeader = document.getElementById("writeHeader");
    writeHeader.style.display = "block";
    ipc.send('writeAction', "");
}

function closeFunction() {
    ipc.send('closeAction', "");
}

function minimizeFunction() {
    ipc.send('minimizeAction', "");
}

function maximizeFunction() {
    var maximize = document.getElementById('maximize');
    maximize.innerHTML = "unmaximize";
    maximize.onclick = unmaximizeFunction;
    ipc.send('maximizeAction', "");
}

function unmaximizeFunction() {
    var maximize = document.getElementById('maximize');
    maximize.innerHTML = "maximize";
    maximize.onclick = maximizeFunction;
    ipc.send('unmaximizeAction', "");
}