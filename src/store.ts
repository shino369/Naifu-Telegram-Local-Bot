import { Subject, Subscription } from 'rxjs'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { FileSource, NegativeStr, QueueInstance, UserConfig } from './types.js'
import {
  color,
  getJsonFileFromPath,
  processImg,
  switchModel,
  writeJsonFileFromPath,
} from './utils/index.js'
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
  private modelSwitching: boolean
  private currentModel: string
  private sampling: string

  constructor(bot: Telegraf<Context<Update>>) {
    this.bot = bot
    this.queue = []
    this.processQueue = []
    this.obsNewJob$ = new Subject<UserConfig>()
    this.lock = false
    this.modelSwitching = false
    const stored = getJsonFileFromPath('./store.json')
    this.negativeSetting = stored.negative
    this.currentModel = 'aything' //default
    this.sampling = stored.sampling
    console.log(
      color(
        'operation',
        `using negative: ${this.negativeSetting}, using model: ${this.currentModel}, sampling: ${this.sampling}`,
      ),
    )
    this.obsNewJobSub = this.obsNewJob$.subscribe(_newJob => {
      // sort by weight
      this.queue = this.queue.sort((a, b) => a.weight - b.weight)
      // console.log(color('text', '=================start of queue============='))
      // console.log(this.queue)
      // console.log(color('text', '==================end of queue=============='))
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

  public setModelSwitching(isSwitvhing: boolean) {
    this.modelSwitching = isSwitvhing
  }

  public getModelSwitching() {
    return this.modelSwitching
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

  public getCurrentModel() {
    return this.currentModel
  }

  public getSamling() {
    return this.sampling
  }

  public setSampling(sampling: number) {
    switch (sampling) {
      case 0:
        this.sampling = 'k_euler_ancestral'
        break
      case 1:
        this.sampling = 'k_euler'
        break
      case 2:
        this.sampling = 'ddim'
        break
      case 3:
        this.sampling = 'k_dpmpp_2m_ka'
        break
      case 4: 
        this.sampling = 'k_dpmpp_sde_ka'
        break
    }
    writeJsonFileFromPath('./store.json', {
      negative: this.negativeSetting,
      sampling: this.sampling,
    })
    return this.sampling
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
        const errorRetry = async () => {
          try {
            if (job.img) {
            console.log('fetching: ', job.img.file)
            const res = await fetch(job.img.file)
            const bff = await res.buffer()
            job.img = {
              ...job.img,
              file: bff.toString('base64'),
            }
          }
          } catch (err) {
            console.log('error fetching image from server... retry in 5 sec...')
            await this.delay(5000)
            errorRetry()
          }
        }
        
        await errorRetry()

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

            if(parseInt(job.config.save)){
              console.log(
                color(
                  'variable',
                  `return image with uncompressed format on by one`,
                ),
              )
                let errCount = 0
                for (let i = 0; i < img.length; i ++) {
                  const source = (img[i].media as FileSource)
                  try {
                    await this.bot.telegram
                    .sendDocument(
                      job.channelId ? job.channelId : job.id,
                      source,
                      replyToMsgObj,
                    )
                  } catch (err) {
                    console.log(err)
                    errCount++
                  }
                }

                if(errCount > 0) {
                  this.bot.telegram
                  .sendMessage(
                    job.channelId ? job.channelId : job.id,
                    `${img}: Job of generating ${errCount} image(s) created by ${job.first_name} failed`,
                    replyToMsgObj,
                  )
                  .catch(error => {
                    console.log(color('error', 'error sending reply'))
                    console.log(error)
                  })
                }

            } else {
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
                    this.bot.telegram
                      .sendMediaGroup(job.channelId ? job.channelId : job.id, img)
                      .catch(error => {
                        console.log(color('error', 'error sending reply'))
                      })
                  }, 3000)
                })
            }


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
              })
          }
        } catch (e) {
          console.log(color('error', 'error sending reply'))
        }

        // remove from process queue
        this.shiftprocessQueue()

        console.log(
          color('operation', `remaining ${this.queue.length} job(s)......`),
        )

        // if still have remaining job, delay before next loop
        if (this.queue.length > 0) {
          await this.delay(40000)
        }
      }
      this.lock = false
    }

    // no current running jobs
  }

  public async switchModelByName(name: string, chatId: number) {
    this.setModelSwitching(true)
    switchModel(name).then((res: { [key: string]: string }) => {
      if (res.error) {
        this.bot.telegram.sendMessage(chatId, res.error)
      } else {
        this.currentModel = name
        this.bot.telegram.sendMessage(chatId, res.content)
      }

      this.setModelSwitching(false)
    })
  }
}
