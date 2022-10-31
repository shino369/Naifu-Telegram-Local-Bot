import { queuingCache } from '../index'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Telegraf } from 'telegraf/typings/telegraf'
import {
  calculateWH,
  color,
  getEditmsgStr,
  getInlinKeyboard,
  returnImg2ImgDefaultWithNewSeed,
  validate,
  writeJsonFileFromPath,
} from '../utils'
import { T2ImgConfig, UserConfig } from 'types'

const PROMPT = 'prompt'

const img2img = (bot: Telegraf<Context<Update>>) => {
  bot.on('photo', async ctx => {
    const userId = ctx.message.from.id
    if (queuingCache.getQueue().find((userConfig) => userConfig.id === userId)) {
      console.log(color('error', `previous job not finished`))
      return ctx.reply(
        `${
          ctx.message.from.first_name ? ` ${ctx.message.from.first_name}` : ''
        },  your previous job is still on the queue.`,
      )
    }

    const { caption, photo } = ctx.update.message

    if (caption && caption.indexOf('/prompt') === 0) {
      // must start with
      const originalSizePhoto = photo[photo.length - 1]

      let inputArr: string[] = []
      if (caption) {
        inputArr = caption
          .substring(PROMPT.length + 1)
          .split('\n')
          .map(arr => arr.trim())
          .filter(arr => arr !== '')
      }

      const defaultSetting = returnImg2ImgDefaultWithNewSeed()

      const newSetting: any = {}

      const settingKeys: (keyof T2ImgConfig)[] = [
        ...(Object.keys(defaultSetting) as (keyof T2ImgConfig)[]),
      ]

      settingKeys.forEach(key => {
        const match = inputArr.find(f => f.includes(`${key}:`))
        if (match) {
          if(!validate(key, match)) {
            console.log(color('error', `wrong format for ${key}`))
            return
          }
          newSetting[key] = match.substring(key.length + 1).trim() as any
        }
      })

      const newJob: UserConfig = {
        ...ctx.message.from,
        status: '',
        number: -1,
        config: {
          ...defaultSetting,
          ...newSetting,
          positive: newSetting.positive
            ? defaultSetting.positive + newSetting.positive
            : defaultSetting.positive,
          seed: newSetting.seed ? newSetting.seed : defaultSetting.seed,
        }
      }

      // push to pre-queue
      // queuingCache.pushPreQueue(newJob)

      // write log
      // writeJsonFileFromPath('./log/log.json', newJob, true)

      return ctx.replyWithPhoto(originalSizePhoto.file_id, {
        caption: getEditmsgStr(
          newJob,
          calculateWH(originalSizePhoto.width, originalSizePhoto.height),
        ),
        reply_markup: getInlinKeyboard(),
      })
    }
  })
}

export default img2img
