(function () {
    var results;
    this.assert = function assert(value, desc) {
        var li = document.createElement("li");
        li.className = value ? "pass" : "fail";
        li.appendChild(document.createTextNode(desc));
        results.appendChild(li);
        if (!value) {
            li.parentNode.parentNode.className = "fail";
        }
        return li;
    };
    this.desc = function desc(desc) {
        var li = document.createElement("li");
        li.className = "desc";
        li.appendChild(document.createTextNode(desc));
        results.appendChild(li);
        return li;
    };
    this.test = function test(name, fn) {
        results = document.getElementById("results");
        results = assert(true, name).appendChild(
            document.createElement("ul"));
        return fn();
    };
    document.onkeydown = function(evt) {
    evt = evt || window.event;
        console.log(evt.keyCode);
        switch (evt.keyCode) {
            case 37:
                document.getElementById("soft-reload").focus();
                break;
            case 39:
                document.getElementById("hard-reload").focus();
                break;
    }
};
})();

var ip = "http://localhost:3000/";

function imbadatnaming(endpoint) {
    return ip + endpoint;
}

window.onload = function () {
    test("last modified since", lastModified).then(function () {
        return test("if modified since", ifModifiedSince);
    }).then(function () {
        return test("cached for one year, ignore first run after server restart", cachedForOneYear);
    }).then(function () {
        return test("cache control response set to max-age=2 (seconds)", responseCachedForTwoSecond);
    }).then(function () {
        return test("cache control response set to no cache, no store, must revalidate", responseNoCacheNoStoreMustRevalidate);
    });
};

function lastModified() {
    return new Promise(function (resolve, reject) {
        var xhr1 = new XMLHttpRequest();
        var xhr2 = new XMLHttpRequest();
        xhr1.open("GET", imbadatnaming("last-modified"));
        xhr1.send();
        xhr1.onload = function (e) {
            desc(xhr1.responseText);
            desc(xhr1.getResponseHeader("Last-Modified"));
            setTimeout(function () {
                xhr2.open("GET", imbadatnaming("last-modified"));
                xhr2.send();
            }, 1);
        };
        xhr2.onload = function (e) {
            assert(xhr2.responseText === "Sun, 25 Sep 2016y 06:18:46 GMT", "if modified since sent to server");
            resolve();
        };
    });
}

function ifModifiedSince() {
    return new Promise(function (resolve, reject) {
        var xhr1 = new XMLHttpRequest();
        var headerValue = "Sun, 25 Sep 2016y 06:18:46 GMT";
        xhr1.open("GET", imbadatnaming("if-modified-since"));
        xhr1.setRequestHeader("If-Modified-Since", headerValue);
        xhr1.send();
        xhr1.onload = function (e) {
            assert(xhr1.responseText === headerValue, "header for if modified since received on server");
            resolve();
        };
    });
}

function cachedForOneYear() {
    return new Promise(function (resolve, reject) {
        var xhr1 = new XMLHttpRequest();
        var xhr2 = new XMLHttpRequest();
        var xhr3 = new XMLHttpRequest();
        xhr1.open("GET", imbadatnaming("cached-for-one-year"));
        xhr1.send();
        xhr1.onload = function (e) {
            desc(xhr1.getResponseHeader("Cache-Control"));
            setTimeout(function () {
                xhr2.open("GET", imbadatnaming("cached-for-one-year"));
                xhr2.send();
            }, 1);
        };
        xhr2.onload = function (e) {
            setTimeout(function () {
                xhr3.open("GET", imbadatnaming("cached-for-one-year-first-call-value"));
                xhr3.send();
            }, 1);
        };
        xhr3.onload = function (e) {
            desc("value from call: " + xhr1.responseText);
            desc("value from call: " + xhr2.responseText);
            desc("value stored on server (first call): " + xhr3.responseText);
            assert(xhr1.responseText === xhr3.responseText && xhr2.responseText === xhr3.responseText, "call should be cached");
            // test("cache control request only if cached", requestOnlyIfCached);
            resolve();
        };
    });
}

function responseNoCacheNoStoreMustRevalidate() {
    return new Promise(function (resolve, reject) {
        var xhr1 = new XMLHttpRequest();
        var xhr2 = new XMLHttpRequest();
        xhr1.open("GET", imbadatnaming("nocache-nostore-mustrevalidate"));
        xhr1.send();
        xhr1.onload = function (e) {
            xhr2.open("GET", imbadatnaming("nocache-nostore-mustrevalidate"));
            xhr2.send();
        };
        xhr2.onload = function (e) {
            assert(xhr1.responseText === xhr2.responseText, "call should not be cached");
            resolve();
        };
    });
}

function responseCachedForTwoSecond() {
    return new Promise(function (resolve, reject) {
        var xhr1 = new XMLHttpRequest();
        var xhr2 = new XMLHttpRequest();
        var xhr3 = new XMLHttpRequest();

        xhr1.open("GET", imbadatnaming("cached-for-two-second"));
        xhr1.send();
        xhr1.onload = function (e) {
            desc(" value from call: " + xhr1.responseText);
            setTimeout(function () {
                xhr2.open("GET", imbadatnaming("cached-for-two-second"));
                xhr2.send();
            }, 500);
        };
        xhr2.onload = function (e) {
            desc(" value from call: " + xhr2.responseText);
            assert(xhr1.responseText === xhr2.responseText, "call should be cached");
            setTimeout(function () {
                xhr3.open("GET", imbadatnaming("cached-for-two-second"));
                xhr3.send();
            }, 2500);
        };
        xhr3.onload = function (e) {
            desc(" value from call: " + xhr3.responseText);
            assert(xhr2.responseText !== xhr3.responseText, "call should not be cached");
            resolve();
        };
    });
}
