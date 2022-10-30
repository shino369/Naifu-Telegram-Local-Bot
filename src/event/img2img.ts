import { cache } from "../index"
import Context from "telegraf/typings/context"
import { Update } from "telegraf/typings/core/types/typegram"
import { Telegraf } from "telegraf/typings/telegraf"
import { calculateWH, getEditmsgStr, getRandom, initialize, writeJsonFileFromPath } from "../utils"
import { config } from "../constant"
import { T2ImgConfig } from "types"
import { Markup } from "telegraf"

const img2img = (bot: Telegraf<Context<Update>>) => {
    bot.on('photo', async ctx => {
        const userId = ctx.message.from.id
        if (cache[userId] && cache[userId].status !== 'idle') {
          return ctx.reply('you previous job has not been finished yet')
        }
        initialize(userId, ctx.message.from)
        const { caption, photo } = ctx.update.message
    
        if (caption && caption.indexOf('/prompt') === 0) {  // must start with
          const originalSizePhoto = photo[photo.length - 1]
    
          initialize(userId, ctx.message.from)
    
          let inputArr: string[] = []
          if (caption) {
            inputArr = caption
            .substring(7)   
            .split('\n')
              .map(arr => arr.trim())
              .filter(arr => arr !== '')
          }
    
          const randomSeed = getRandom()
          const defaultSetting = {
            positive: config.default.positive,
            negative: config.default.negative,
            scale: config.default.scale,
            steps: config.default.img2imgStep,
            size: config.default.size,
            orientation: config.default.orientation,
            strength: config.default.strength,
            noise: config.default.noise,
            seed: randomSeed,
          }
    
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
            seed: newSetting.seed ? newSetting.seed : randomSeed,
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
            reply_markup: {
              inline_keyboard: [
                new Array(5)
                  .fill(0)
                  .map((arr, index) =>
                    Markup.button.callback(`${index + 1}`, `number_${index + 1}`),
                  ),
                new Array(5)
                  .fill(0)
                  .map((arr, index) =>
                    Markup.button.callback(`${index + 6}`, `number_${index + 6}`),
                  ),
              ],
            },
          })
        }
    
        // else do nothing
      })
}

export default img2img