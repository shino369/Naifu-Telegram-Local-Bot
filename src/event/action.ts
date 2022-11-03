import { queuingCache } from '../index'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Telegraf } from 'telegraf/typings/telegraf'
import { color, getRandom, processImg, writeJsonFileFromPath } from '../utils'
import { config } from '../constant'
import { T2ImgConfig, UserConfig } from 'types'
import fetch from 'node-fetch'

// async function sendMedia(
//   bot: Telegraf<Context<Update>>,
//   userId: number,
//   number: number,
//   newCache: UserConfig,
//   img: { file: string; width: number; height: number } | undefined,
//   channelId?: number,
// ) {
//   //by value to prevent bug
//   processImg(number, newCache, img).then(img => {
//     bot.telegram.sendMediaGroup(channelId ? channelId : userId, img)
//     cache[userId].status = 'idle'
//     writeJsonFileFromPath('./store.json', cache)
//   })
// }

const action = (bot: Telegraf<Context<Update>>) => {
  bot.action(/.+/, async ctx => {
    const split = ctx.match[0].split('_')
    const userId = ctx.update.callback_query.from.id
    const channelId = ctx.update.callback_query.message?.chat.id
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

    if (queuingCache.getQueue().find(userConfig => userConfig.id === userId)) {
      console.log(color('error', `previous job not finished`))
      return ctx.reply(
        `${
          ctx.update.callback_query.from.first_name
            ? ` ${ctx.update.callback_query.from.first_name}`
            : ''
        }, your previous job is still on the queue.`,
      )
    }

    switch (split[0]) {
      case 'number':
        const number = parseInt(split[1])
        console.log(
          color(
            'operation',
            `......generating image with old prompt but new seed`,
          ),
        )
        // clicking button again
        // reassign seed

        const configIdStr = '[config ID]:'
        const configId = text
          .substring(
            text.indexOf(configIdStr) + configIdStr.length,
            text.indexOf('\n'),
          )
          .trim()

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
          'seed',
        ]
        // const createdUser = parseInt(
        //   text.substring(text.indexOf('[ID]:') + 5, text.indexOf('\n')).trim(),
        // )
        const newText = text
          .replace(
            'default negative prompt,',
            config.default.negative[queuingCache.getNegativeSetting()],
          )
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
              return obj
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
                    .toLowerCase()
                : newText
                    .substring(curr.value + `[${curr.key}]:`.length)
                    .trim()
                    .toLowerCase(),
          }),
          {},
        ) as T2ImgConfig
        console.log(
          color('error', '================ reformatted obj ================='),
        )
        console.log(reformated)
        console.log(
          color(
            'operation',
            '================ reformatted obj =================',
          ),
        )

        const newJob: UserConfig = {
          ...ctx.update.callback_query.from,
          status: '',
          messageId: ctx.update.callback_query.message?.message_id,
          configId: configId,
          number: number === -1 ? 1 : number,
          config: {
            ...reformated,
            positive: config.default.positive + reformated.positive,
            seed: number === -1 ? reformated.seed : getRandom(), // to be redesigned
          },
        }

        if (img) {
          newJob['img'] = img
        }

        if (channelId) {
          newJob['channelId'] = channelId
        }

        // write log
        writeJsonFileFromPath('./log/log.json', newJob, true)

        queuingCache.pushQueue(newJob)
        queuingCache.setObsNewJob(newJob)
        // sendMedia(bot, userId, number, newJob, img, channelId)
        return ctx.answerCbQuery(
          `${number === -1 ? 1 : number} image${
            number > 1 ? 's' : ''
          } pushed to queue.... please wait`,
        )

      default:
        return ctx.reply('default') // not defined
    }

    // return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
  })
}

export default action
