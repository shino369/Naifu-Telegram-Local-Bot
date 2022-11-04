import dotenv from 'dotenv'
import { Store } from './store.js'
import { Telegraf } from 'telegraf'
import { prompt, img2img, action } from './event/index.js'

dotenv.config()
const bot = new Telegraf(process.env.TOKEN as string, {
  handlerTimeout: 9_000_000,
})
export const queuingCache = new Store(bot)

function init() {
  prompt(bot)
  img2img(bot)
  action(bot)

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
