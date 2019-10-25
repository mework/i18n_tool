import axios from 'axios';
import { logs } from './';
let instance = axios.create();

// http request 拦截器
instance.interceptors.request.use(
  config => {
    return config
  },
  err => {
    return Promise.reject(err)
  }
)

// http response 拦截器
instance.interceptors.response.use(
  response => {
    return response
  },
  //接口错误状态处理，也就是说无响应时的处理
  error => {
    logs.error('请求报错：', error);
    return Promise.reject(error) // 返回接口返回的错误信息
  }
)

export default instance;