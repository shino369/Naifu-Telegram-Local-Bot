import { cache } from '../index'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Telegraf } from 'telegraf/typings/telegraf'
import { T2ImgConfig } from 'types'
import {
  writeJsonFileFromPath,
  initialize,
  getEditmsgStr,
  getInlinKeyboard,
  returnDefaultWithNewSeed,
} from '../utils'

const PROMPT = 'prompt'

const prompt = (bot: Telegraf<Context<Update>>) => {
  bot.command(PROMPT, async ctx => {
    const userId = ctx.message.from.id
    if (cache[userId] && cache[userId].status !== 'idle') {
      return ctx.reply('you previous job has not been finished yet')
    }

    initialize(userId, ctx.message.from)

    const inputArr = ctx.message.text
      .substring(PROMPT.length + 1)
      .split('\n')
      .map(arr => arr.trim())
      .filter(arr => arr !== '')

    const defaultSetting = returnDefaultWithNewSeed()

    const newSetting: any = {}

    const settingKeys: (keyof T2ImgConfig)[] = [
      ...(Object.keys(defaultSetting) as (keyof T2ImgConfig)[]),
    ]

    settingKeys.forEach(key => {
      const match = inputArr.find(f => f.includes(`${key}:`))
      if (match) {
        newSetting[key] = match.substring(key.length + 1).trim() as any
      }
    })

    cache[userId].config = {
      ...defaultSetting,
      ...newSetting,
      positive: newSetting.positive
        ? defaultSetting.positive + newSetting.positive
        : defaultSetting.positive,
      seed: newSetting.seed ? newSetting.seed : defaultSetting.seed,
    }
    cache[userId] = {
      ...cache[userId],
      status: 'pending',
    }

    writeJsonFileFromPath('./store.json', cache)
    const newCache = cache[userId]
    // console.log(newCache)
    return ctx.reply(getEditmsgStr(newCache), {
      reply_markup: getInlinKeyboard(),
    })
  })
}

export default prompt
