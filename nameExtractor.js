const rp = require('request-promise');
const fetch = require('node-fetch');
const fs = require('fs/promises');
const { Iconv } = require('iconv');
const jschardet = require('jschardet');
const cheerio = require('cheerio');

function anyToUtf8(str) {
    const { encoding } = jschardet.detect(str);
    console.log("source encoding = " + encoding);
    const iconv = new Iconv(encoding, 'utf-8//translit//ignore');
    return iconv.convert(str).toString();
}

(async () => {
    const res = await rp({
        url: 'http://cfs.tistory.com/custom/blog/148/1481372/skin/images/FQ4.htm',
        encoding: null
    });
    const body = anyToUtf8(res);
    const regex = /\/([^\/\.]+)\.htm/;
    const $ = cheerio.load(body);
    const ret = $('a')
        .map((_, el) => $(el).attr('href'))
        .filter((_, el) => regex.test(el))
        .map((_, el) => regex.exec(el)[1])
        .toArray();

    await fs.writeFile("names.txt", ret.slice(3).join('\r\n'), 'utf-8');
    console.log('Done');
})();
