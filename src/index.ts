import dotenv from 'dotenv'
import { Store } from './store.js'
import { Telegraf } from 'telegraf'
import { prompt, img2img, action } from './event/index.js'

dotenv.config()
const bot = () => new Telegraf(process.env.TOKEN as string, {
  handlerTimeout: 9_000_000,
})
export let queuingCache:any = undefined

const sleep = (time: number) => {
  return new Promise(res =>{
    setTimeout(() => {
      res(true)
    }, time);
  })
}

async function init() {
  try {
    const _bot = bot().catch(error => {
      console.log(error)
      throw new Error('init error')
    })
    queuingCache = new Store(_bot)
    prompt(_bot)
    img2img(_bot)
    action(_bot)
  } catch (error) {
    // connection error

    console.log(error)
    console.log('retry in 5 secs...')
    await sleep(5000)
    init()
  }

  
  // exec(`start cmd.exe /K start_default.bat`)
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
