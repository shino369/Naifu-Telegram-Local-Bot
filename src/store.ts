import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { UserConfig } from 'types'

export class Store {
  private queue: UserConfig[]
  private preQueue: UserConfig[]
  private obsNewJob$: Subject<UserConfig>
  private isIdle: boolean
  private negativeSetting: string

  constructor() {
    this.queue = []
    this.preQueue = []
    this.obsNewJob$ = new Subject<UserConfig>()
    this.isIdle = true
    this.negativeSetting = 'default'
  }

  public getNegativeSetting() {
    return this.negativeSetting
  }

  public setNegativeSetting(negative: 'default' | 'long' | 'none' | 'mid') {
    this.negativeSetting = negative
  }

  public setIsIdle(flag: boolean) {
    this.isIdle = flag
  }

  public getIsIdle() {
    return this.isIdle
  }

  public getObsNewJob(): Observable<UserConfig> {
    return this.obsNewJob$.asObservable()
  }

  public setObsNewJob(userconfig: UserConfig) {
    this.obsNewJob$.next(userconfig)
  }

  public pushQueue(userconfig: UserConfig) {
    this.queue.push(userconfig)
  }

  public pushPreQueue(userconfig: UserConfig) {
    this.preQueue.push(userconfig)
  }

  public shiftQueue() {
    return this.queue.shift() as UserConfig
  }

  public shiftPreQueue() {
    return this.preQueue.shift() as UserConfig
  }

  public getFirstPreQueue() {
    return this.preQueue[0]
  }
  public getFirstQueue() {
    return this.queue[0]
  }

  public getQueue() {
    return this.queue
  }

  public getPreQueue() {
    return this.preQueue
  }
}
