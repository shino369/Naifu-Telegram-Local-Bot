import { Subject, Subscription } from 'rxjs'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { NegativeStr, UserConfig } from './types.js'
import { color, getJsonFileFromPath, processImg } from './utils/index.js'
import { Telegraf } from 'telegraf/typings/telegraf'

export class Store {
  private queue: UserConfig[]
  private processQueue: UserConfig[]
  private obsNewJob$: Subject<UserConfig>
  private obsNewJobSub: Subscription
  private negativeSetting: string
  private bot: Telegraf<Context<Update>>
  private lock: boolean

  constructor(bot: Telegraf<Context<Update>>) {
    this.bot = bot
    this.queue = []
    this.processQueue = []
    this.obsNewJob$ = new Subject<UserConfig>()
    this.lock = false
    this.negativeSetting = getJsonFileFromPath('./store.json').negative
    console.log(color('operation', `using negative: ${this.negativeSetting}`))

    this.obsNewJobSub = this.obsNewJob$.subscribe(_newJob => {
      // if idle
      if (!this.lock) {
        this.lock = true
        this.startBatchJob()
      } else {
        console.log(color('error', 'image processer is still running, no need to restart'))
      }
    })

    this.bot.launch()
  }

  //=====================================
  //========== public function ==========
  //=====================================
  public cleanSubscription(arguement?: string) {
    this.obsNewJobSub.unsubscribe()
    if (arguement) {
      this.bot.stop(arguement)
    }
  }

  public getQueue() {
    return this.queue
  }

  public getProcessQueue() {
    return this.processQueue
  }

  public getNegativeSetting() {
    return this.negativeSetting
  }

  public setNegativeSetting(negative: NegativeStr) {
    this.negativeSetting = negative
  }

  // new incoming job received
  public pushQueue(userconfig: UserConfig) {
    this.queue.push(userconfig)
    // trigger event
    this.obsNewJob$.next(userconfig)
  }

  //=====================================
  //========== private function ==========
  //=====================================

  private pushprocessQueue(userconfig: UserConfig) {
    this.processQueue.push(userconfig)
  }

  private shiftQueue() {
    return this.queue.shift() as UserConfig
  }

  private shiftprocessQueue() {
    return this.processQueue.shift() as UserConfig
  }

  private delay(ms: number) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true)
      }, ms)
    })
  }

  private async startBatchJob() {
    // no current running jobs
    if (this.processQueue.length === 0) {
      while (this.queue.length > 0) {
        console.log(color('operation', 'processing image......'))
        const startTime = new Date()

        // remove top job from queue
        const job = this.shiftQueue()

        // push to process queue
        this.pushprocessQueue(job)
        // console.log(job)
        const img = await processImg(job.number, job, job.img)
        const endTime = new Date()
        console.log(
          color(
            'variable',
            `${job.number} image(s) finished in ${endTime.getTime() - startTime.getTime()}ms`,
          ),
        )
        this.bot.telegram.sendMediaGroup(
          job.channelId ? job.channelId : job.id,
          img,
          {
            reply_to_message_id: job.messageId,
          },
        )

        // remove from process queue
        this.shiftprocessQueue()
        
        console.log(
          color(
            'operation',
            `remaining ${this.queue.length} job(s)......`,
          ),
        )

        // if still have remaining job, delay before next loop
        if(this.queue.length > 0) {
          await this.delay(15000)
        }
        // console.log(
        //   color(
        //     'variable',
        //     `added delay to ${new Date().getTime() - startTime.getTime()}ms`,
        //   ),
        // )
      }
      this.lock = false
    }
  }
}
