import { Subject, Subscription } from 'rxjs'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { NegativeStr, QueueInstance, UserConfig } from './types.js'
import { color, getJsonFileFromPath, processImg } from './utils/index.js'
import { Telegraf } from 'telegraf/typings/telegraf'
import fetch from 'node-fetch'

export class Store {
  private queue: QueueInstance[]
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
      // sort by weight
      this.queue = this.queue.sort((a,b) => a.weight - b.weight)

      // if idle
      if (!this.lock) {
        this.lock = true
        this.startBatchJob()
      } else {
        console.log(
          color(
            'error',
            'image processer is still running, no need to restart',
          ),
        )
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
  public pushQueue(userconfig: QueueInstance) {
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
    if (this.processQueue.length === 0) {
      while (this.queue.length > 0) {
        console.log(color('operation', 'processing image......'))
        const startTime = new Date()

        // remove top job from queue
        const job = this.shiftQueue()

        // push to process queue
        this.pushprocessQueue(job)
        // console.log(job)

        // fetch the actual image if img2img
        if (job.img) {
          const res = await fetch(job.img.file)
          const bff = await res.buffer()
          job.img = {
            ...job.img,
            file: bff.toString('base64'),
          }
        }

        const img = await processImg(job.number, job, job.img)
        const endTime = new Date()

        const replyToMsgObj = {
          reply_to_message_id: job.messageId,
        }
 
        // success

        try {
          if (typeof img !== 'string' && img.length > 0) {
            console.log(
              color(
                'variable',
                `${job.number} image(s) finished in ${
                  endTime.getTime() - startTime.getTime()
                }ms`,
              ),
            )

            this.bot.telegram
              .sendMediaGroup(
                job.channelId ? job.channelId : job.id,
                img,
                replyToMsgObj,
              )
              .catch(error => {
                console.log(color('error', 'error sending reply'))
                console.log(error)
                setTimeout(() => {
                  this.bot.telegram.sendMediaGroup(
                    job.channelId ? job.channelId : job.id,
                    img,
                  )
                }, 3000)
              })
          } else {
            this.bot.telegram
              .sendMessage(
                job.channelId ? job.channelId : job.id,
                `${img}: Job of generating ${job.number} image(s) created by ${job.first_name} failed`,
                replyToMsgObj,
              )
              .catch(error => {
                console.log(color('error', 'error sending reply'))
                console.log(error)
                setTimeout(() => {
                  this.bot.telegram.sendMessage(
                    job.channelId ? job.channelId : job.id,
                    `${img}: Job of generating ${job.number} image(s) created by ${job.first_name} failed`,
                  )
                }, 3000)
              })
          }
        } catch (e) {
          console.log(color('error', 'error sendinf reply'))
        }

        // remove from process queue
        this.shiftprocessQueue()

        console.log(
          color('operation', `remaining ${this.queue.length} job(s)......`),
        )

        // if still have remaining job, delay before next loop
        if (this.queue.length > 0) {
          await this.delay(15000)
        }
      }
      this.lock = false
    }

    // no current running jobs
  }
}
