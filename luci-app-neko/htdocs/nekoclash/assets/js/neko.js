document.addEventListener('DOMContentLoaded', function () {
    var pth = window.location.pathname;
    
    if (pth === "/nekoclash/settings.php"){
        const cliver = document.getElementById('cliver');
        const corever = document.getElementById('corever');
        
        if (cliver && corever) {
            fetch("./lib/log.php?data=neko_ver")
                .then(response => response.text())
                .then(result => {
                    cliver.innerHTML = result;
                });
            fetch("./lib/log.php?data=core_ver")
                .then(response => response.text())
                .then(result => {
                    corever.innerHTML = result;
                });
        }
    }
    else {
        const logs = document.getElementById("logs");
        const binLogs = document.getElementById("bin_logs");
        const uptotal = document.getElementById("uptotal");
        const downtotal = document.getElementById("downtotal");
        
        if (logs || binLogs) {
            setInterval(function() {
                if (logs) {
                    fetch("./lib/log.php?data=neko")
                        .then(response => response.text())
                        .then(result => {
                            logs.innerHTML = result;
                            logs.scrollTop = logs.scrollHeight;
                        });
                }
                if (binLogs) {
                    fetch("./lib/log.php?data=bin")
                        .then(response => response.text())
                        .then(result => {
                            binLogs.innerHTML = result;
                        });
                }
            }, 1000);
        }

        if (uptotal || downtotal) {
            setInterval(function() {
                if (uptotal) {
                    fetch("./lib/up.php")
                        .then(response => response.text())
                        .then(result => {
                            uptotal.innerHTML = result;
                        });
                }
                if (downtotal) {
                    fetch("./lib/down.php")
                        .then(response => response.text())
                        .then(result => {
                            downtotal.innerHTML = result;
                        });
                }
            }, 1000);
        }
    }
});
