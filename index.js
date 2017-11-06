var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');
var path = require('path');

var purl = "https://ivweb.io/";
var commonDir = "/Users/seven/project/downhtml";
var pageUrlInfo = url.parse(purl);
app.get('/', function (req, res) {
    request(purl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var arr = [];
            var purlInfo = url.parse(purl);
            var downLoadUrl = "";
            $("script[src!='']").each(function (i, elem) {
                var src = $(this).attr("src");
                getUrlContent(getUrl(src, purlInfo));
                $(this).attr("src", removeStr(src));
                arr.push(src);
            });
            arr.push("")
            $("link[rel='stylesheet']").each(function (i, elem) {
                ///url\([^()]*[\s\S]*?[^()]*\)/gi
                var href = $(this).attr("href");
                getUrlContent(getUrl(href, purlInfo));
                $(this).attr("href", removeStr(href));
                arr.push(href);
            });
            //getUrlContent(purl);
            writeFile(commonDir + "/index.html", $.html());
            //res.write(arr.join("<br/>"));
            res.json(arr);
        }
    })
});

var server = app.listen(3000, function () {
    console.log('listening at 3000');
});

var getUrl = function (src, urlInfo) {
    if (src.indexOf("//") === 0) {
        //exp //7.url.cn/edu/jslib/jquery/1.9.1/jquery.min.js
        //取当前的protocol
        return urlInfo.protocol + src;
    } else if (src.indexOf("/") === 0) {
        //exp /public/js/index.js?v=8007401866
        return urlInfo.protocol + "//" + urlInfo.host + src;
    } else if (src.indexOf("../") === 0) {
        //exp ../public/js/index.js?v=8007401866
        var arr1 = src.split("../");
        var pathArr = urlInfo.pathname.split("/");
        pathArr.splice(pathArr.length - arr1.length, arr1.length);
        return urlInfo.protocol + "//" + urlInfo.host + pathArr.json("/") + src.substr(src.lastIndexOf("../") + 2);
    } else {
        //exp1 ./public/js/index.js?v=8007401866
        //exp2 public/js/index.js?v=8007401866
        var pathArr = src.split("/");
        pathArr[pathArr.length - 1] = src;
        return urlInfo.protocol + "//" + urlInfo.host + pathArr.json("/");
    }
};

var removeStr = function (str) {
    var first = str[0];
    if (first === "/" || first === ".") {
        return removeStr(str.substr(1));
    }
    return str;
};

/**
 * 
 * @param {*url} url 
 */
var getUrlContent = function (_url) {
    console.log(_url);
    request(_url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var urlInfo = url.parse(_url);
            var path = commonDir + "/";
            if (pageUrlInfo.host != urlInfo.host) {
                path += urlInfo.hostname;
            }
            writeFile(path + urlInfo.pathname, body)
        }
    })
};

//递归创建目录 同步方法  
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

//递归创建目录 异步方法  
function mkdirs(dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            //console.log(path.dirname(dirname));  
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
            });
        }
    });
}

var writeFile = function (_path, content) {
    var dir = path.dirname(_path);
    if (!fs.existsSync(dir)) {
        mkdirsSync(dir);
    }
    fs.writeFile(_path, content, function (err) {
        if (err) {
            //console.log('error：path:' + _path + ',error:' + err);
        } else {
            //console.log('success：path:' + _path);
        }
    });
}