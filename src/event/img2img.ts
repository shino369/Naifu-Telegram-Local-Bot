import { cache } from '../index'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Telegraf } from 'telegraf/typings/telegraf'
import {
  calculateWH,
  getEditmsgStr,
  getInlinKeyboard,
  initialize,
  returnImg2ImgDefaultWithNewSeed,
  writeJsonFileFromPath,
} from '../utils'
import { T2ImgConfig } from 'types'

const PROMPT = 'prompt'

const img2img = (bot: Telegraf<Context<Update>>) => {
  bot.on('photo', async ctx => {
    const userId = ctx.message.from.id
    if (cache[userId] && cache[userId].status !== 'idle') {
      return ctx.reply('you previous job has not been finished yet')
    }
    initialize(userId, ctx.message.from)
    const { caption, photo } = ctx.update.message

    if (caption && caption.indexOf('/prompt') === 0) {
      // must start with
      const originalSizePhoto = photo[photo.length - 1]

      initialize(userId, ctx.message.from)

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
      return ctx.replyWithPhoto(originalSizePhoto.file_id, {
        caption: getEditmsgStr(
          newCache,
          calculateWH(originalSizePhoto.width, originalSizePhoto.height),
        ),
        reply_markup: getInlinKeyboard(),
      })
    }

    // else do nothing
  })
}

export default img2img
