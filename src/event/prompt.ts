import { queuingCache } from '../index'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Telegraf } from 'telegraf/typings/telegraf'
import { T2ImgConfig, UserConfig } from 'types'
import {
  writeJsonFileFromPath,
  getEditmsgStr,
  getInlinKeyboard,
  returnDefaultWithNewSeed,
  color,
  validate,
} from '../utils'

const PROMPT = 'prompt'

const prompt = (bot: Telegraf<Context<Update>>) => {
  bot.command(PROMPT, async ctx => {
    const userId = ctx.message.from.id

    // check if exist in queue
    if (queuingCache.getQueue().find(userConfig => userConfig.id === userId)) {
      console.log(color('error', `previous job not finished`))
      return ctx.reply(
        `${
          ctx.message.from.first_name ? ` ${ctx.message.from.first_name}` : ''
        },  your previous job is still on the queue.`,
      )
    }

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
      const match = inputArr.find(f =>
        f.toUpperCase().includes(`${key.toUpperCase()}:`),
      )
      if (match) {
        if (!validate(key, match)) {
          console.log(color('error', `wrong format for ${key}`))
          return
        }

        newSetting[key] = match.substring(key.length + 1).trim() as any
      }
    })

    const newJob: UserConfig = {
      ...ctx.update.message.from,
      status: '',
      number: -1,
      config: {
        ...defaultSetting,
        ...newSetting,
        positive: newSetting.positive
          ? defaultSetting.positive + newSetting.positive
          : defaultSetting.positive,
        seed: newSetting.seed ? newSetting.seed : defaultSetting.seed,
      },
    }

    // push to pre-queue
    // queuingCache.pushPreQueue(newJob)

    // write log
    // writeJsonFileFromPath('./log/log.json', newJob, true)

    return ctx.reply(getEditmsgStr(newJob), {
      reply_markup: getInlinKeyboard(),
    })
  })
}

export default prompt
