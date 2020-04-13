import {
  zh,
  en,
  tw,
  ja,
  ko,
  ru,
  ms,
} from './lang';
import { util, errorLog, changeLog } from './utils';
import fs from 'fs';

const del = require('del');
const {
  getType,
  translate
} = util;

// 语种  ru：俄语、ko：韩语、en：英语、zh-TW：中文（繁体）、ja：日语、zh：中文
const tlKey = {
  ru: 'ru',
  ko: 'ko',
  en: 'en',
  tw: 'zh-TW',
  ja: 'ja',
  zh: 'zh',
  ms: 'ms',
};

const fromLang = zh,
  from = JSON.parse(JSON.stringify(fromLang));

let toLang,  // 要转换到的语言
  to,
  toLangKey, // 转换的语言key值和名字
  toLangGoogleKey, // google翻译语言的key值
  fromTextArr; // 源文本数组

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

  let formCurrent = JSON.parse(JSON.stringify(from)); // 转换前的原有数据
  let toCurrent = to; // 转换后的原有数据

  position.forEach(async (item, index) => {
    formCurrent = formCurrent[item];
    let _toCurrent = toCurrent[item];

    // 判断进行转换的是否有此值，如果不是数组最后一项，就强行干个对象上去
    if (!_toCurrent && (position.length - 1 !== index)) return toCurrent = toCurrent[item] = {};

    // 取到数组最后一项才得到值
    if (!_toCurrent && position.length - 1 === index) {
      !toCurrent[item] && fromTextArr.push(formCurrent);
      
      // 赋值操作
      toCurrent[item] = `{{%${ formCurrent }%}}`;
      
      // 记录改动点
      changeLog.info(`${ toLangKey } 改动点：${ position.join('>') }` );
    }

    // 移动 toCurrent 指针
    toCurrent = toCurrent[item];
  })
}

/**
 * 程序启动
 */
function start() {
  return new Promise(async (resolve, reject) => {
    // 循环开始处理数据
    for (const [key, item] of Object.entries(from)) {
      loop(key, item, [key]);
    }
    // 将数据处理为请求文本格式
    let requestText = fromTextArr.join('\r\n');
    // 翻译后的文本数组
    let toTextArr;
    // 翻译请求
    await translate(requestText, toLangGoogleKey).then(async res => {
      if (!res) return;

      // 获取翻译后的文本数组
      toTextArr = res.map(item => (item[0].replace(/\r\n/g, '')));
      to = JSON.stringify(to);

      // 替换文本并转化中文双引号为单引号
      fromTextArr.forEach((item, index) => {
        to = to.replace(new RegExp(`{{%${item}%}}`, 'g'), toTextArr[index].replace(/"/g, ''));
      })

      // 写入文本
      to = `export default ${to}`;
      
      fs.writeFileSync(`./build/${ toLangKey }.js`, to);

      console.log(`${ toLangKey }写入完成`);
      resolve();

    }).catch(e => {
      errorLog.error('translate错误', e);
      reject();
    })
  })
}

/**
 * 运行
 */
async function run() {
  // 删除文件夹
  del.sync(['./build'])
  
  // 创建文件夹
  fs.mkdirSync('./build');

  const langArr = [
    { source: ru, key: 'ru' },
    { source: ko, key: 'ko' },
    { source: en, key: 'en' },
    { source: tw, key: 'tw' },
    { source: ja, key: 'ja' },
    { source: ms, key: 'ms' },
  ]

  for (let i = 0; i < langArr.length; i++) {
    const item = langArr[i];
    toLang = item.source;
    to = JSON.parse(JSON.stringify(toLang));
    toLangKey = item.key;
    toLangGoogleKey = tlKey[toLangKey];
    fromTextArr = [];
    changeLog.info(`${ toLangKey } 改动点开始 -----------------------------------------------------` );
    await start();
    changeLog.info(`${ toLangKey } 改动点结束 -----------------------------------------------------` );
  }

  changeLog.info(`单次翻译结束-----------------------------------------------------` );
  changeLog.info(`----------------------------------------------------------------------------------------------------------` );
  changeLog.info(`----------------------------------------------------------------------------------------------------------` );
};

run();