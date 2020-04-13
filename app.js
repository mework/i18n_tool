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
import { transformKey, mode } from './config';
import fs from 'fs';

const del = require('del');
const {
  getType,
  translate
} = util;

const fromLang = zh,
  from = JSON.parse(JSON.stringify(fromLang));

let toLang,  // 要转换到的语言
  to,
  toLangKey, // 转换的语言key值和名字
  toLangGoogleKey, // google翻译语言的key值
  fromTextArr, // 源文本数组
  changeObj = {}; // 改变的对象

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
  let diffCurrent = changeObj;  // 找出差异的数据对象

  position.forEach(async (item, index) => {
    formCurrent = formCurrent[item];
    let _toCurrent = toCurrent[item];
    // 区分模式
    if (mode === 'default') {
      // 判断进行转换的是否有此值，如果不是数组最后一项，就强行干个对象上去
      if (!_toCurrent && (position.length - 1 !== index)) return toCurrent = toCurrent[item] = {};

      // 取到数组最后一项才得到值
      if (!_toCurrent && position.length - 1 === index) {
        fromTextArr.push(formCurrent);
        
        // 赋值操作
        toCurrent[item] = `{{%${ formCurrent }%}}`;
        
        // 记录改动点
        changeLog.info(`${ toLangKey } 改动点：${ position.join('>') }` );
      }

    } else if (mode === 'findDiff') {
      // 判断进行转换的是否有此值，如果不是数组最后一项，就强行干个对象上去
      if (!_toCurrent && (position.length - 1 !== index)) return toCurrent = toCurrent[item] = {};

      // 转换后的没有值，需要赋值对象
      if (!_toCurrent) {
        position.forEach((subitem, subindex) => {
          if (diffCurrent[subitem] !== undefined && position.length - 1 !== subindex) return diffCurrent = diffCurrent[subitem];
          
          if (position.length - 1 !== subindex) {
            diffCurrent = diffCurrent[subitem] = {};
          }
        })
      }


      // 取到数组最后一项才得到值
      if (!_toCurrent && position.length - 1 === index) {
        fromTextArr.push(formCurrent);
        
        // 赋值操作
        diffCurrent[item] = `{{%${ formCurrent }%}}`;
        
        // 记录改动点
        changeLog.info(`${ toLangKey } 改动点：${ position.join('>') }` );
      }

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

    if (fromTextArr.length <= 0) {
      return console.log('文件无需翻译！！');
    }

    // 将数据处理为请求文本格式
    let requestText = fromTextArr.join('\r\n');
    // 翻译后的文本数组
    let toTextArr;
    // 翻译请求
    await translate(requestText, toLangGoogleKey).then(async res => {
      if (!res) return;

      

      if (mode === 'default') {

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

      } else if (mode === 'findDiff') {
        
        changeObj = JSON.stringify(changeObj);

        // 替换文本并转化中文双引号为单引号
        fromTextArr.forEach((item, index) => {
          changeObj = changeObj.replace(new RegExp(`{{%${item}%}}`, 'g'), toTextArr[index].replace(/"/g, ''));
        })

        // 写入文本
        changeObj = `export default ${changeObj}`;
        
        fs.writeFileSync(`./build/${ toLangKey }.js`, changeObj);

      }

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
    toLangGoogleKey = transformKey[toLangKey];
    fromTextArr = [];
    changeObj = {};
    changeLog.info(`${ toLangKey } 改动点开始 -----------------------------------------------------` );
    await start();
    changeLog.info(`${ toLangKey } 改动点结束 -----------------------------------------------------` );
  }

  changeLog.info(`单次翻译结束-----------------------------------------------------` );
  changeLog.info(`----------------------------------------------------------------------------------------------------------` );
  changeLog.info(`----------------------------------------------------------------------------------------------------------` );
};

run();