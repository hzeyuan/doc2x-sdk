# DOC2X SDK

[English](#doc2x-sdk-en)
[中文](#doc2x-sdk-zh)

# 开始使用 [doc2x](https://www.npmjs.com/package/doc2x)

> npm install doc2x

### 前置条件:key 的获取可以在[doc2x](https://doc2x.com)中获取

# 使用方法

```ts
import { Doc2x } from 'doc2x';

const doc2x = new Doc2x({
  key: 'your key',
});

// 获取token
const token = await doc2x.token;
// 获取refreshToken
const refreshToken = await doc2x.refreshToken;
// 查看剩余次数
const remain = await doc2x.remain();
console.log(remain);

//   const filePath = path.resolve(__dirname, 'test.pdf');
//   const fileContent = fs.createReadStream(filePath);
//异步上传pdf文件
const res = await doc2x.asyncPdf({
  file: filePath,
});
/**
 * res:AsyncPdfResponse
 * {
 *  "code": 0,
 *  "message": "success",
 *  "data": {
 *  "uuid": "返回uuid"
 *  }
 * }
 */
console.log(res);

// 使用获取的uuid查询进度
const status = await doc2x.asyncStatus(res.data.uuid);

// 同步上传pdf文件
const res = await doc2x.pdf({
  file: filePath,
  callback:{
        onProgress:(res)=>{
            console.log('progress',res.progress);
            console.log('result',res.result);
            console.log('version',res.result.version)
            console.log('pages',res.result.pages);
        }
        onSuccess:(res)=>{
            console.log(res);
        }
  }
});
```

## 目前支持 API

- /asyncPdf:异步上传 pdf 文件
- /asyncStatus:查询异步上传 pdf 文件的状态
- /pdf:同步上传 pdf 文件
- remain:查看剩余次数

# 测试

> npm run test

```
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------------------------------------------------------------
All files |      47 |        0 |      55 |   46.39 |
 index.ts |      47 |        0 |      55 |   46.39 | 67,71,92,97,103,127,133-134,144-165,177-203,219-232,271-272,295,301-302
----------|---------|----------|---------|---------|-------------------------------------------------------------------------
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        3.498 s, estimated 4 s
```

#
