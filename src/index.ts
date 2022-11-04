import dotenv from 'dotenv'
import { Store } from './store.js'
import { Telegraf } from 'telegraf'
import { prompt, img2img, action } from './event/index.js'
import { getJsonFileFromPath, processImg, color } from './utils/index.js'

dotenv.config()
export const queuingCache = new Store(
  new Telegraf(process.env.TOKEN as string, {
    handlerTimeout: 9_000_000,
  }),
  [prompt, img2img, action],
)

function init() {
  process.on('exit', () => {
    queuingCache.cleanSubscription()
  })

  process.once('SIGINT', () => {
    queuingCache.cleanSubscription('SIGINT')
    
  })
  process.once('SIGTERM', () => {
    queuingCache.cleanSubscription('SIGTERM')
  })
}

init()
