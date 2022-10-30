import { Orientation, Size } from './interface/interface'
import { color, getImageResult } from './utils/functions'
import fs from 'fs'
import dotenv from 'dotenv'
import { Markup, Telegraf } from 'telegraf'
import { config } from './constant'
import { Options, Payload, T2ImgConfig, UserConfig } from 'types'
import fetch from 'node-fetch'
import moment from 'moment'
import { InputMediaPhoto } from 'telegraf/typings/core/types/typegram'
import _, { indexOf, size } from 'lodash'
import { getJsonFileFromPath, writeJsonFileFromPath } from './utils/fileIO'
// import { Payload } from 'types'

const PROMPT = 'prompt'
dotenv.config()
export const cache: { [key: string]: UserConfig } = {} //= getJsonFileFromPath('./store.json')

const bot = new Telegraf(process.env.TOKEN as string, {
  handlerTimeout: 9_000_000,
})

function getRandom() {
  return Math.floor(Math.random() * 2 ** 32 - 1).toString()
}

async function processImg(
  num: number,
  newCache: UserConfig,
  img: { file: string; width: number; height: number } | undefined,
) {
  console.log(newCache.config)
  let img2imgOptions = {}
  if (img) {
    const { width: tempW, height: tempH } = calculateWH(img.width, img.height)
    img2imgOptions = {
      strength: newCache.config.strength,
      noise: newCache.config.noise,
      image: img.file,
      width: tempW,
      height: tempH,
    }
  } else {
    img2imgOptions = {
      width:
        config.sizeMapper[newCache.config.orientation][newCache.config.size]
          .width,
      height:
        config.sizeMapper[newCache.config.orientation][newCache.config.size]
          .height,
    }
  }
  const payload: Payload = {
    prompt: newCache.config.positive!,
    scale: parseInt(newCache.config.scale),
    sampler: 'k_euler_ancestral',
    steps: parseInt(newCache.config.steps),
    seed: parseInt(newCache.config.seed),
    n_samples: num,
    ucPreset: 0,
    uc: newCache.config.negative,
    width: 0, //temp
    height: 0, //temp
    ...img2imgOptions,
  }
  console.log(_.omit(payload, ['uc', 'image']))
  const files = await getImageResult(payload)

  const medias: InputMediaPhoto[] = files.map((file, index) => ({
    type: 'photo',
    media: { source: file.image },
    caption: `seed: ${payload.seed} #${index + 1}`,
  }))
  return medias
}

function getEditmsgStr(
  newCache: UserConfig,
  img2img?: { width: number; height: number },
) {
  const str = `select number of image to be generated.\n[positive]:\n${newCache.config.positive.replace(
    config.default.positive,
    '',
  )}\n[negative]:\n${newCache.config.negative.replace(
    config.default.negative,
    'default negative prompt',
  )}\n[scale]: ${newCache.config.scale}　　[steps]: ${newCache.config.steps}${
    img2img
      ? `　　[width]: ${img2img.width}　　[height]: ${img2img.height}　　[strength]: ${newCache.config.strength}　　[noise]: ${newCache.config.noise}`
      : `　　[size]: ${newCache.config.size}　　[orientation]: ${newCache.config.orientation}`
  }`
  return str
}

function getInlinKeyboard() {
  return {
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
  }
}

function initialize(userId: number, userData: any) {
  cache[userId] = {
    ...userData,
    status: 'idle',
  }
}

function discordBotInit() {


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

    const randomSeed = getRandom()
    const defaultSetting = {
      positive: config.default.positive,
      negative: config.default.negative,
      scale: config.default.scale,
      steps: config.default.steps,
      size: config.default.size,
      orientation: config.default.orientation,
      seed: randomSeed,
    }

    const newSetting: any = {}

    const settingKeys: (keyof T2ImgConfig)[] = [
      ...(Object.keys(defaultSetting) as (keyof T2ImgConfig)[]),
    ]

    settingKeys.forEach(key => {
      const match = inputArr.find(f => f.includes(key))
      if (match) {
        newSetting[key] = match.substring(key.length + 1).trim() as any
      }
    })

    // console.log(newSetting)

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
    return ctx.reply(getEditmsgStr(newCache), {
      reply_markup: getInlinKeyboard(),
    })
  })

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
            sendMedia(userId, number, newCache, img)

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
            sendMedia(userId, number, newCache, img)
            return ctx.reply(`generating ${number} image again.... please wait`)
          }

        default:
          return ctx.reply('default') // not defined
      }
    }

    // return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
  })

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

  bot.launch()
}

async function sendMedia(
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

function calculateWH(width: number, height: number) {
  // calculate WH
  let tempW = Math.floor(width / 64) * 64
  let tempH = Math.floor(height / 64) * 64

  if (tempH >= tempW) {
    // portrait or square
    if (tempH > 1024) {
      tempW = Math.floor(((1024 / tempH) * tempW) / 64) * 64
      tempH = 1024
    }
  } else {
    // landscape
    if (tempW > 1024) {
      tempH = Math.floor(((1024 / tempW) * tempH) / 64) * 64
      tempW = 1024
    }
  }

  return { width: tempW, height: tempH }
}

discordBotInit()
