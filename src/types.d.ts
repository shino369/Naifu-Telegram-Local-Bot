export * from './interface/index.js'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string
      CLIENT_ID: string
      BASE_URL: string
      ROOTNAME: string
      BUILD_ROOTNAME: string
      EXT: string
      BUILD_EXT: string
    }
  }
}

export declare class Store {
  private queue;
  private preQueue;
  private obsNewJob$;
  private isIdle;
  private negativeSetting;
  constructor();
  getNegativeSetting(): string;
  setNegativeSetting(negative: 'default' | 'long' | 'none' | 'mid'): void;
  setIsIdle(flag: boolean): void;
  getIsIdle(): boolean;
  getObsNewJob(): Observable<UserConfig>;
  setObsNewJob(userconfig: UserConfig): void;
  pushQueue(userconfig: UserConfig): void;
  pushPreQueue(userconfig: UserConfig): void;
  shiftQueue(): UserConfig;
  shiftPreQueue(): UserConfig;
  getFirstPreQueue(): UserConfig;
  getFirstQueue(): UserConfig;
  getQueue(): UserConfig[];
  getPreQueue(): UserConfig[];
}