// 语言: TypeScript
// 说明: 为缺失类型的第三方库提供最小模块声明，便于 tsc 编译通过

declare module 'tablestore' {
  const TableStore: any;
  export default TableStore;
}

declare module '@alicloud/sts-sdk' {
  export default class STS {
    constructor(opts: any)
    assumeRole(roleArn: string, policy: string, durationSeconds?: number, sessionName?: string): Promise<any>
  }
}

