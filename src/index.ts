/* eslint-disable @typescript-eslint/no-unsafe-return */
import axios, { AxiosResponse } from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { Readable } from 'stream';
type Doc2xConfig = {
  baseUrl?: string;
  key?: string;
};

type TokenResponse = {
  data: {
    token: string;
    refresh_token: string;
  };
  code: 'success';
  msg: string;
};
type Page = {
  url: string;
  page_idx: number;
  page_width: number;
  page_height: number;
  md: string;
};

type AsyncStatusData = {
  progress: number;
  result?: {
    version: string;
    pages: Page[];
  };
  status: 'processing' | 'success' | 'failed';
};

type AsyncStatusResponse = {
  code: string;
  data: AsyncStatusData;
  msg: string;
};

interface LimitResponse {
  data: {
    remain: number;
  };
}

interface AsyncPdfResponse {
  code: string;
  data: {
    uuid: string;
  };
  msg: string;
}

export class DOC2X {
  baseUrl: string;
  _token: string;
  key: string;
  _refreshToken: string;

  constructor({
    baseUrl = process.env.DOC2X_BASE_URL,
    key = process.env.DOC2X_KEY,
  }: Doc2xConfig) {
    if (!baseUrl) {
      throw new Error('DOC2X_BASE_URL is required');
    }

    if (!key) {
      throw new Error('DOC2X_KEY is required');
    }
    this.baseUrl = baseUrl;
    this.key = key;
    this._token = '';
    this._refreshToken = '';
  }

  init = async (): Promise<void> => {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/api/token/refresh`,
        null,
        {
          headers: {
            Authorization: `Bearer ${this.key}`, // 用你的令牌替换
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }

      const data: TokenResponse = response.data;
      if (data.code !== 'success') {
        throw new Error(data.msg);
      }
      this._token = data.data.token;
      this._refreshToken = data.data.refresh_token;
    } catch (error) {
      throw error;
    }
  };

  get token() {
    return this._token;
  }

  get refreshToken() {
    return this._refreshToken;
  }

  remain = async (): Promise<number> => {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/api/platform/limit`,
        {
          headers: {
            Authorization: `Bearer ${this._token}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }

      const data: LimitResponse = response.data;
      return data.data.remain;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  exportFile = async ({
    request_id,
    to,
  }: {
    request_id: string;
    to: string;
  }): Promise<Blob | string> => {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/export?request_id=${request_id}&to=${to}`,
        {
          headers: {
            Authorization: `Bearer ${this._token}`,
          },
        }
      );
      const contentType = response.headers['Content-Type'];
      if (contentType === 'application/msdoc') {
        return response.data;
      } else if (contentType === 'application/zip') {
        return response.data;
      } else {
        throw new Error('Unknown Content-Type');
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  asyncImg = async ({
    file,
    option,
  }: {
    file: {
      file: Blob;
    };
    option?: string;
  }): Promise<string> => {
    try {
      const form = new FormData();
      form.append('file', file.file);
      if (option) {
        form.append('option', option);
      }

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/api/platform/async/img`,
        form,
        {
          headers: {
            Authorization: `Bearer ${this._token}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }

      const data: string = response.data;
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  pdf = async ({
    file,
    callback,
  }: {
    file: {
      file: Readable;
    };
    callback?: {
      onProgress: (message: AsyncStatusData) => void;
      onError: (error: Event) => void;
      onSuccess: () => void;
    };
  }) => {
    const res = await this.asyncPdf({ file });
    const that = this;
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        const result = await that.asyncStatus({ uuid: res.data.uuid });
        if (result.data.status === 'success') {
          clearInterval(intervalId);
          callback?.onSuccess();
        } else if (result.data.status === 'processing') {
          callback?.onProgress(result.data);
        } else if (result.data.status === 'failed') {
          clearInterval(intervalId);
          reject(new Error('Task failed'));
        }
      });
    });
  };
  asyncPdf = async ({
    file,
  }: {
    file: {
      file: Readable;
    };
  }): Promise<AsyncPdfResponse> => {
    try {
      const form = new FormData();
      form.append('file', file.file);

      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/api/platform/async/pdf`,
        data: form,
        headers: {
          Authorization: `Bearer ${this._token}`,
        },
        responseType: 'json',
      });

      const data: AsyncPdfResponse = response.data;
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  asyncStatus = async ({
    uuid,
  }: {
    uuid: string;
  }): Promise<AsyncStatusResponse> => {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/platform/async/status`,
        {
          params: {
            uuid: uuid,
          },
          headers: {
            Authorization: `Bearer ${this._token}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }

      const data: AsyncStatusResponse = response.data;
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
}
