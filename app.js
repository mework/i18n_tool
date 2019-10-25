import {
  en,
  zh,
  el,
  ja,
  ko,
  ru
} from './lang';
import {
  util
} from './utils';
import fs from 'fs';

const {
  getType,
  translate
} = util;

let _zh = JSON.parse(JSON.stringify(zh));
let _en = JSON.parse(JSON.stringify(en));

// 语种  ru：俄语、ko：韩语、en：英语、zh-TW：中文（繁体）、ja：日语、zh：中文
const tlKey = {
  ru: 'ru',
  ko: 'ko',
  en: 'en',
  el: 'zh-TW',
  ja: 'ja',
  zh: 'zh'
};
let fromTextArr = []; // 源文本数组

/**
 * 循环处理数据
 * @param {String} key 对象的 key 值
 * @param {*} value 对象的 value 值
 * @param {Array} position 当前遍历的位置
 */
function loop(key, value, position) {
  const type = getType(value);

  // 对象处理逻辑
  if (type === 'Object') {
    for (const [subKey, subItem] of Object.entries(value)) {
      loop(subKey, subItem, [...position, subKey]);
    };
    return;
  }

  let formCurrent = JSON.parse(JSON.stringify(_zh)); // 转换前的值
  let toCurrent = _en; // 转换后的值

  position.forEach(async (item, index) => {
    formCurrent = formCurrent[item];
    let _toCurrent = toCurrent[item];

    // 判断进行转换的是否有此值，如果不是数组最后一项，就强行干个对象上去
    if (!_toCurrent && (position.length - 1 !== index)) return toCurrent = toCurrent[item] = {};

    // 取到数组最后一项才得到值
    if (!_toCurrent && position.length - 1 === index) {
      !toCurrent[item] && fromTextArr.push(formCurrent);
      // 赋值操作
      toCurrent[item] = `{%${formCurrent}%}`;
    }

    // 移动 toCurrent 指针
    toCurrent = toCurrent[item];
  })
}

/**
 * 程序启动
 */
function start() {
  // 循环开始处理数据
  for (const [key, item] of Object.entries(_zh)) {
    loop(key, item, [key]);
  }
  // 将数据处理为请求文本格式
  let requestText = fromTextArr.join('\r\n');
  // 翻译后的文本数组
  let toTextArr;

  // 翻译请求
  translate(requestText, tlKey[5]).then(res => {
    if (!res) return;
    // 获取翻译后的文本数组
    toTextArr = res.map(item => (item[0].replace(/\r\n/g, '')));

    // 替换文本
    fromTextArr.forEach((item, index) => {
      _en = JSON.parse(JSON.stringify(_en).replace(new RegExp(`{%${item}%}`, 'g'), toTextArr[index]));
    })

    // 写入文本
    _en = `export default ${JSON.stringify(_en)}`;
    fs.writeFile('./build/en.js', _en, 'utf8', () => {
      console.log('写入完成')
    })
  }).catch(e => {
    console.log('e', e);
  })
}

start();