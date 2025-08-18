// 模块类型声明文件

declare module 'tablestore' {
  export interface ClientOptions {
    accessKeyId: string;
    accessKeySecret: string;
    endpoint: string;
    instancename: string;
  }

  export interface TableStoreClient {
    putRow(params: any): Promise<any>;
    getRow(params: any): Promise<any>;
    updateRow(params: any): Promise<any>;
    deleteRow(params: any): Promise<any>;
    batchGetRow(params: any): Promise<any>;
    getRange(params: any): Promise<any>;
  }

  export class Client implements TableStoreClient {
    constructor(options: ClientOptions);
    putRow(params: any): Promise<any>;
    getRow(params: any): Promise<any>;
    updateRow(params: any): Promise<any>;
    deleteRow(params: any): Promise<any>;
    batchGetRow(params: any): Promise<any>;
    getRange(params: any): Promise<any>;
  }

  export const Long: any;
  export const PlainBuffer: any;
}

declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  export function v3(name: string, namespace: string): string;
  export function v5(name: string, namespace: string): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
}

declare module 'alipay-sdk' {
  export interface AlipayOptions {
    appId: string;
    privateKey: string;
    alipayPublicKey?: string;
    gateway?: string;
    timeout?: number;
    camelCase?: boolean;
    charset?: string;
    version?: string;
    signType?: string;
    keyType?: string;
  }

  export interface AlipayFormData {
    method: string;
    bizContent: any;
    returnUrl?: string;
    notifyUrl?: string;
  }

  export interface AlipayResult {
    code: string;
    msg: string;
    subCode?: string;
    subMsg?: string;
    [key: string]: any;
  }

  export default class AlipaySdk {
    constructor(options: AlipayOptions);
    
    exec(method: string, params?: any, options?: any): Promise<AlipayResult>;
    pageExec(method: string, params?: any, options?: any): Promise<string>;
    sdkExec(method: string, params?: any, options?: any): Promise<string>;
    
    checkNotifySign(postData: any, headers?: any): boolean;
    checkResponseSign(responseData: string, responseHeaders?: any): boolean;
    
    sign(params: any): string;
    
    static AlipaySdk: typeof AlipaySdk;
  }
}

// 扩展全局类型
declare global {
  interface Window {
    // 如果需要在window对象上添加属性
    __DRAWORLD_CONFIG__?: any;
  }
}

// 确保这个文件被视为模块
export {};
