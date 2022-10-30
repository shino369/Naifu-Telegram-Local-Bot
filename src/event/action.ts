
import { cache } from "../index"
import Context from "telegraf/typings/context"
import { Update } from "telegraf/typings/core/types/typegram"
import { Telegraf } from "telegraf/typings/telegraf"
import { calculateWH, color, getEditmsgStr, getRandom, initialize, processImg, writeJsonFileFromPath } from "../utils"
import { config } from "../constant"
import { T2ImgConfig, UserConfig } from "types"
import { Markup } from "telegraf"
import fetch from "node-fetch"


async function sendMedia(
    bot: Telegraf<Context<Update>>,
    userId: number,
    number: number,
    newCache: UserConfig,
    img: { file: string; width: number; height: number } | undefined,
  ) {
    //by value to prevent bug
    processImg(number, newCache, img).then(img => {
      bot.telegram.sendMediaGroup(userId, img)
      cache[userId].status = 'idle'
      writeJsonFileFromPath('./store.json', cache)
    })
  }

const action = (bot: Telegraf<Context<Update>>) => {
    bot.action(/.+/, async ctx => {
        const split = ctx.match[0].split('_')
        const userId = ctx.update.callback_query.from.id
    
        let text: string = (ctx.update.callback_query.message as any)['text']
        let photo
        let url: URL
        let img
        if (!text) {
          text = (ctx.update.callback_query.message as any)['caption']
          const photos = (ctx.update.callback_query.message as any)['photo']
          photo = photos[photos.length - 1]
          url = await bot.telegram.getFileLink(photo.file_id as string)
          const res = await fetch(url.toString())
          const bff = await res.buffer()
    
          img = {
            file: bff.toString('base64'),
            width: photo.width,
            height: photo.height,
          }
        }
    
        // console.log(ctx.update.callback_query.message)
        if (!cache[userId]) {
          initialize(userId, ctx.update.callback_query.from)
        }
    
        if (cache[userId].status === 'waiting') {
          console.log(color('error', `previous job not finished`))
          return ctx.reply('you previous job has not been finished yet')
        } else {
          switch (split[0]) {
            case 'number':
              const number = parseInt(split[1])
    
              if (cache[userId].status === 'pending') {
                console.log(color('operation', `......generating image`))
                // clicking button after prompt
                cache[userId] = {
                  ...cache[userId],
                  status: 'waiting',
                }
                // console.log(cache[userId])
    
                writeJsonFileFromPath('./store.json', cache)
                console.log('Status changed to: ', cache[userId].status)
                //promise, don't wait
    
                const newCache = cache[userId]
                sendMedia(bot, userId, number, newCache, img)
    
                return ctx.reply(`generating ${number} image.... please wait`)
              } else if (cache[userId].status === 'idle') {
                console.log(
                  color(
                    'operation',
                    `......generating image with old prompt but new seed`,
                  ),
                )
                // clicking button again
                // reassign seed
    
                const keysArr = [
                  'positive',
                  'negative',
                  'scale',
                  'steps',
                  'size',
                  'orientation',
                  'strength',
                  'noise',
                  'width',
                  'height',
                ]
                const newText = text
                  .replace('default negative prompt', config.default.negative)
                  .replaceAll('\n', '')
    
                const indexObj: { [key: string]: number } = keysArr.reduce(
                  (obj, curKey) => {
                    const indexPos = newText.indexOf(`[${curKey}]:`)
                    if (indexPos !== -1) {
                      return {
                        ...obj,
                        [curKey]: indexPos,
                      }
                    } else {
                      return {
                        ...obj,
                      }
                    }
                  },
                  {},
                )
                const newKeys = Object.keys(indexObj)
                const arrOfObj = newKeys.map(key => ({
                  key: key,
                  value: indexObj[key],
                }))
                const sorted = arrOfObj.sort((a, b) => a.value - b.value)
    
                const reformated = sorted.reduce(
                  (result, curr, index) => ({
                    ...result,
                    [curr.key]:
                      index < sorted.length - 1
                        ? newText
                            .substring(
                              curr.value + `[${curr.key}]:`.length,
                              sorted[index + 1].value,
                            )
                            .trim()
                        : newText
                            .substring(curr.value + `[${curr.key}]:`.length)
                            .trim(),
                  }),
                  {},
                ) as T2ImgConfig
                console.log(color('error', '================================='))
                console.log(reformated)
                console.log(color('error', '================================='))
                let oldConfig = reformated
                // JSON.parse(
                //   `{${text
                //     .substring(text.indexOf('[poitive]'))
                //     .replaceAll('\n', '')
                //     .replaceAll('[', '","')
                //     .replaceAll(']:', '":"')
                //     .replace('","', '"') // the first
                //     .replace(
                //       'default negative prompt',
                //       config.default.negative,
                //     )}"}`,
                // )
    
                // const oldKey = Object.keys(oldConfig)
                // oldConfig = oldKey.reduce(
                //   (obj, cur) => ({
                //     ...obj,
                //     [cur]: oldConfig[cur].trim(),
                //   }),
                //   {},
                // )
    
                cache[userId] = {
                  ...cache[userId],
                  status: 'waiting',
                  config: {
                    ...oldConfig,
                    seed: getRandom(),
                  },
                }
                writeJsonFileFromPath('./store.json', cache)
    
                const newCache = cache[userId]
                sendMedia(bot, userId, number, newCache, img)
                return ctx.reply(`generating ${number} image again.... please wait`)
              }
    
            default:
              return ctx.reply('default') // not defined
          }
        }
    
        // return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
      })
}