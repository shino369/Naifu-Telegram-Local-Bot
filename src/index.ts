import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { UserConfig } from 'types'

import {prompt, img2img, action} from './event'

dotenv.config()
export const cache: { [key: string]: UserConfig } = {} //= getJsonFileFromPath('./store.json')

const bot = new Telegraf(process.env.TOKEN as string, {
  handlerTimeout: 9_000_000,
})

prompt(bot)
img2img(bot)
action(bot)
bot.launch()