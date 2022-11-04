import { color } from './utils/functions'
import dotenv from 'dotenv'
import { Store } from './store'
import { Telegraf } from 'telegraf'

import { prompt, img2img, action } from './event'
import { getJsonFileFromPath, processImg } from './utils'

dotenv.config()
export const queuingCache = new Store()

const bot = new Telegraf(process.env.TOKEN as string, {
  handlerTimeout: 9_000_000,
})

function init() {
  prompt(bot)
  img2img(bot)
  action(bot)
  // storeListener()

  const negative = getJsonFileFromPath('./store.json')
  console.log(color('operation', `using negative: ${negative['negative']}`))
  queuingCache.setNegativeSetting(negative['negative'])

  const imcomingSubscription = queuingCache
    .getObsNewJob()
    .subscribe(_userConfig => {
      console.log(color('variable', 'new incoming request received'))
      if (queuingCache.getIsIdle()) {
        startBatchJob()
      }
    })

  process.on('exit', () => {
    imcomingSubscription.unsubscribe()
  })

  process.once('SIGINT', () => {
    imcomingSubscription.unsubscribe()
    bot.stop('SIGINT')
  })
  process.once('SIGTERM', () => {
    imcomingSubscription.unsubscribe()
    bot.stop('SIGTERM')
  })

  bot.launch()
}

async function startBatchJob() {
  if (queuingCache.getQueue().length > 0) {
    // has unfinished job
    queuingCache.setIsIdle(false)
    while (queuingCache.getQueue().length > 0) {
      console.log(color('operation', 'processing image......'))
      const job = queuingCache.getFirstQueue()
      // console.log(job)
      const img = await processImg(job.number, job, job.img)
      bot.telegram.sendMediaGroup(job.channelId ? job.channelId : job.id, img, {
        reply_to_message_id: job.messageId,
      })

      console.log(
        color(
          'variable',
          `${queuingCache.getQueue().length - 1} job(s) remaining......`,
        ),
      )
      // delay 5 sec
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(true)
        }, 10000)
      })
      queuingCache.shiftQueue()
    }
    queuingCache.setIsIdle(true)
  }
}


init()
