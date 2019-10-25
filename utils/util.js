import { axios } from './';

/**
 * 获取数据类型
 * @param {*} data 需要获取类型的对象
 * @returns {String}
 */
const getType = (data) => {
  return Object.prototype.toString.call(data).replace(/[\[\]]/g, '').split(' ')[1];
};

/**
 * 翻译操作
 * @param {String} text 需要翻译的文本
 * @param {String} lang 翻译的语种
 */
const translate = (text, lang) => {
  return new Promise((resolve, reject) => {
    axios.get(`http://translate.google.cn/translate_a/single?client=gtx&sl=zh-CN&tl=${ lang }&dt=t&q=${ encodeURI(text) }`).then(res => {
      if (res.status === 200) return res.data
    }).then(data => {
      const successText = data[0][0];
      resolve(successText);
    }).catch(e => {
      reject(e);
    })
  })
};

export default {
  getType,
  translate
}