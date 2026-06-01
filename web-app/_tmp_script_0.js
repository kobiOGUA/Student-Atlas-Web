
window.onerror = function(m, s, l, c, e) {
    var div = document.createElement('div');
    div.style.cssText = 'color:red; background:white; position:fixed; z-index:99999; top:0; left:0; padding:20px; font-size:20px; word-break:break-all;';
    div.innerText = 'GLOBAL ERROR: ' + m + ' \n' + (e ? e.stack : '');
    document.body.appendChild(div);
};
window.onunhandledrejection = function(e) {
    var div = document.createElement('div');
    div.style.cssText = 'color:orange; background:white; position:fixed; z-index:99999; top:100px; left:0; padding:20px; font-size:20px; word-break:break-all;';
    div.innerText = 'PROMISE REJECTION: ' + (e.reason && e.reason.stack ? e.reason.stack : e.reason);
    document.body.appendChild(div);
};
