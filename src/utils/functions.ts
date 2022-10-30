import chalk from 'chalk'
import { config } from '../constant'
import fetch from 'node-fetch'
import { FileRes, Payload, UserConfig } from 'types'
import moment from 'moment'
import { cache } from '../index'
import { Markup } from 'telegraf'
import { InputMediaPhoto } from 'telegraf/typings/core/types/typegram'
import _ from 'lodash'

type colorType = 'text' | 'variable' | 'error' | 'operation'

const themeColors = {
  text: '#ff8e4d',
  variable: '#ff624d',
  error: '#f5426c',
  operation: '#088F8F',
}

export const getThemeColor = (color: colorType) =>
  Number(`0x${themeColors[color].substring(1)}`)

export const color = (color: colorType, message: any) => {
  return chalk.hex(themeColors[color])(message)
}

export const fetchImgToBase64 = async (url: string) => {
  let img = ''
  await fetch(url).then(async res => {
    await res.buffer().then(bff => {
      img = bff.toString('base64')
    })
  })
  return img
}

export const getImageResult = async (payload: Payload) => {
  const res = await fetch(process.env.BASE_URL + config.generateImageURL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.text()

  const str = data.toString()

  const splitArr = str.split('event: newImage')

  const fileArr: FileRes[] = []

  splitArr
    .map(arr => arr.trim())
    .forEach(img => {
      if (img.length > 0) {
        const index = img.indexOf('data:')
        const newStr = img.substring(index + 5)
        const imgBuff = Buffer.from(newStr, 'base64')
        const newDate = moment().format('YY-MM-DD-hh-mm-ss')
        const ran = Math.random() * 10
        fileArr.push({
          name: newDate + ran + '.png',
          image: imgBuff,
        })
      }
    })

  return fileArr
}

export const initialize = (userId: number, userData: any) => {
  cache[userId] = {
    ...userData,
    status: 'idle',
  }
}

export const getRandom = () => {
  return Math.floor(Math.random() * 2 ** 32 - 1).toString()
}

export const getEditmsgStr = (
  newCache: UserConfig,
  img2img?: { width: number; height: number },
) => {
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

export const getInlinKeyboard = () => {
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

export async function processImg(
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

export function calculateWH(width: number, height: number) {
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