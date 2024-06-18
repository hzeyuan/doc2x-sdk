import { DOC2X } from '../src/index';
import fs from 'fs';
import path from 'path';
const doc2x = new DOC2X({
  baseUrl: 'https://api.doc2x.noedgeai.com',
  key: process.env.DOC2X_KEY,
});
let taskuuid = '8a56941e-31f0-421c-a89a-2ba31faf42c6';
jest.setTimeout(100000);
describe('DOC2X', () => {
  describe('init', () => {
    it('should initialize the DOC2X client', async () => {
      await doc2x.init();
      expect(doc2x.token).toBeDefined();
      expect(doc2x.refreshToken).toBeDefined();
    });
  });

  describe('limit', () => {
    it('should return the remaining limit as a number', async () => {
      const result = await doc2x.remain();
      console.log('limit', result);
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });
  });

  it('should upload a PDF file asynchronously and return a string', async () => {
    // Arrange
    const filePath = path.resolve(__dirname, 'test.pdf'); // Replace with your file path
    const fileContent = fs.createReadStream(filePath);

    // Act
    const result = await doc2x.asyncPdf({
      file: {
        file: fileContent,
      },
    });

    // Assert
    expect(result).toBeDefined();
    //uuid
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('msg');
    expect(result).toHaveProperty('data.uuid');
    taskuuid = result.data.uuid;
  });

  describe('asyncStatus', () => {
    it('should return an AsyncStatusResponse', async () => {
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const intervalId = setInterval(async () => {
          const result = await doc2x.asyncStatus({ uuid: taskuuid });
          console.dir(result, { depth: 4 });
          expect(result).toBeDefined();
          expect(result).toHaveProperty('code');
          expect(result).toHaveProperty('data');
          expect(result).toHaveProperty('msg');
          expect(result).toHaveProperty('data.progress');
          expect(result).toHaveProperty('data.status');
          if (result.data.status === 'success') {
            clearInterval(intervalId);
            resolve(true);
          } else if (result.data.status === 'failed') {
            clearInterval(intervalId);
            reject(new Error('Task failed'));
          }
        }, 2000);
      });
    });
  });

  // describe('export', () => {
  //   it('should export the document and return a Blob or string', async () => {
  //     const to = 'pdf';

  //     const result = await doc2x.exportFile({ request_id: taskuuid, to });
  //     console.log('export', result);
  //     expect(result).toBeDefined();
  //     expect(result instanceof Blob || typeof result === 'string').toBe(true);
  //   });
  // });
});
