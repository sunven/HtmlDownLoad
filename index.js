const request = require('request');
const cheerio = require('cheerio');
const url = require('url');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite')

const pageurl = "https://www.qq.com/";
const commonDir = "D:\\JavaFile\\downhtml";
const pageUrlInfo = url.parse(pageurl);
request(pageurl, {
    encoding: null
}, function (error, response, bodyBuffer) {
    if (!error && response.statusCode == 200) {
        //<meta charset="gb2312">
        const body = iconv.decode(bodyBuffer, 'gb2312')
        const $ = cheerio.load(body);
        var purlInfo = url.parse(pageurl);
        console.log("js starting...")
        $("script[src!='']").each(function (i, elem) {
            var src = $(this).attr("src");
            getUrlContent(getUrl(src, purlInfo), "js");
            $(this).attr("src", "js/" + path.basename(src));
        });
        console.log("js complete...")
        console.log("css starting...")
        $("link[rel='stylesheet'][href!='']").each(function (i, elem) {
            var href = $(this).attr("href");
            getCssContent(purlInfo, getUrl(href, purlInfo), 'css');
            $(this).attr("href", "css/" + path.basename(href));
        });
        console.log("css complete...")
        console.log("picture starting...")
        $("img[src!='']").each(function (i, elem) {
            const src = $(this).attr("src");
            const filename = getStreamContent(getUrl(src, purlInfo), "img");
            $(this).attr("src", "img/" + filename);
        })
        console.log("picture complete...")
        writeFile(commonDir + "/index.html", $.html());
    }
})

var getUrl = function (src, urlInfo) {
    if (src.indexOf("http") === 0) {
        return src
    } else if (src.indexOf("//") === 0) {
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
        return urlInfo.protocol + "//" + urlInfo.host + pathArr.join("/") + src.substr(src.lastIndexOf("../") + 2);
    } else {
        //exp1 ./public/js/index.js?v=8007401866
        //exp2 public/js/index.js?v=8007401866
        var pathArr = src.split("/");
        pathArr[pathArr.length - 1] = src;
        return urlInfo.protocol + "//" + urlInfo.host + pathArr.join("/");
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
const getStreamContent = function (url, dirname) {
    console.log(url)
    const ext = path.extname(url)
    let filepath = commonDir + "\\" + dirname + "\\" + path.basename(url);
    if (ext == "") {
        filepath += ".jpg"
    }
    request
        .get(url)
        .on('error', function (err) {
            console.log(err)
        })
        .pipe(fs.createWriteStream(genPath(filepath)))
    return path.basename(filepath)
};

const getUrlContent = function (url, dirname) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            writeFile(commonDir + "/" + dirname + "/" + path.basename(url), body)
        }
    })
};

const getCssContent = function (purlInfo, url, dirname) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var arrUrl = body.match(/url\([^()]*[\s\S]*?[^()]*\)/gi);
            for (var index = 0; index < arrUrl.length; index++) {
                var element = arrUrl[index];
                element = element.replace("url(", "")
                element = element.replace(")", "")
                element = element.replace(/\"/g, "")
                console.log(element)
                const filename = getStreamContent(getUrl(element, purlInfo), "img");
                body = body.replace(arrUrl[index], "url(img/" + filename+")")
            }
            writeFile(commonDir + "/" + dirname + "/" + path.basename(url), body)
        }
    })
};

var getContent = function (_url, _callBack) {
    request(_url, function (error, response, body) {
        if (error || response.statusCode != 200) {
            return;
        }
        var urlInfo = url.parse(_url);
        var path = commonDir + "/";
        if (pageUrlInfo.host != urlInfo.host) {
            path += urlInfo.hostname;
        }
        writeFile(path + urlInfo.pathname, body)
        if (_callBack) {
            _callBack(urlInfo, body);
        }
    });
};

var cssRequestCallBack = function (purlInfo, body) {
    //
    var arrUrl = body.match(/url\([^()]*[\s\S]*?[^()]*\)/gi);
    for (var index = 0; index < arrUrl.length; index++) {
        var element = arrUrl[index];
        var url = getUrl(element.substr(4, element.length - 5), purlInfo);
        var ext = path.extname(url);
        var extArr = ["png", "gif", "jpg"];
        if (ext.toLocaleLowerCase == "phg") {

        }
        request(url).pipe(fs.createWriteStream('./' + img_filename));
        console.log(url);
    }
};

function genPath(filepath) {
    if (fs.existsSync(filepath)) {
        const random = Math.floor(Math.random() * 10000);
        const ext = path.extname(filepath);
        return path.dirname(filepath) + "//" + path.basename(filepath, ext) + "_" + random + ext;
    } else {
        return filepath
    }
}

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