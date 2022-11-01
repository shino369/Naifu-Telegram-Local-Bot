import chalk from 'chalk'
import { config } from '../constant'
import fetch from 'node-fetch'
import { FileRes, Payload, UserConfig } from 'types'
import moment from 'moment'
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

export const getRandom = () => {
  return Math.floor(Math.random() * 2 ** 32 - 1).toString()
}

export const getEditmsgStr = (
  newCache: UserConfig,
  img2img?: { width: number; height: number },
) => {
  const str = `Created by${
    newCache.first_name ? ` ${newCache.first_name}` : ''
  } ${newCache.last_name ? ` ${newCache.last_name}, ` : ''} [ID]: ${
    newCache.id
  }\nPlease select number to generate.\n[positive]:\n${newCache.config.positive.replace(
    config.default.positive,
    '',
  )}\n[negative]:\n${newCache.config.negative.replace(
    config.default.negative,
    'default negative prompt',
  )}\n[scale]: ${newCache.config.scale}　　[steps]: ${newCache.config.steps}${
    img2img
      ? `　　[width]: ${img2img.width}　　[height]: ${img2img.height}　　[strength]: ${newCache.config.strength}　　[noise]: ${newCache.config.noise}`
      : `　　[size]: ${newCache.config.size}　　[orientation]: ${newCache.config.orientation}　　[seed]: ${newCache.config.seed}`
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
      [Markup.button.callback(`exact seed`, `number_${-1}`),]
    ],
  }
}

export async function processImg(
  num: number,
  newCache: UserConfig,
  img: { file: string; width: number; height: number } | undefined,
) {
  console.log(color('operation', '......processing image'))
  let img2imgOptions = {}
  if (img) {
    const { width: tempW, height: tempH } = calculateWH(img.width, img.height)
    img2imgOptions = {
      strength: parseFloat(newCache.config.strength),
      noise: parseFloat(newCache.config.noise),
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
    caption: `Created by${
      newCache.first_name ? ` ${newCache.first_name}` : ''
    } ${newCache.last_name ? ` ${newCache.last_name}, ` : ''}\nseed: ${
      payload.seed
    } #${index + 1}`,
  }))
  console.log(color('operation', '......returning image'))
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

export const returnDefaultWithNewSeed = () => {
  const randomSeed = getRandom()
  return {
    positive: config.default.positive,
    negative: config.default.negative,
    scale: config.default.scale,
    steps: config.default.steps,
    size: config.default.size,
    orientation: config.default.orientation,
    seed: randomSeed,
  }
}

export const returnImg2ImgDefaultWithNewSeed = () => {
  const randomSeed = getRandom()
  return {
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
}

export const validate = (key: string, match: string) => {
  const str = match.substring(key.length + 1).trim()
  switch (key) {
    case 'orientation':
      if (!['portrait', 'landscape'].includes(str.toLowerCase())) {
        return false
      }
      return true
    case 'size':
      if (!['small', 'medium', 'large'].includes(str.toLowerCase())) {
        return false
      }
      return true
    case 'steps':
      if (!str.match(/\b([0-9]|[1-4][0-9]|50)\b/) || str.length > 2) {
        return false
      }
      return true
    case 'scale':
      if (!str.match(/\b([0-9]|1[0-9]|2[0-5])\b/) || str.length > 2) {
        return false
      }
      return true
    case 'seed':
      if (
        (key === 'seed' && (parseInt(str) > 4294967295 || parseInt(str) < 0)) ||
        str.length > 10
      ) {
        return false
      }
      return true
    case 'strength':
      'noise'
      if (parseFloat(str) > 1 || parseFloat(str) < 0 || str.length > 3) {
        return false
      }
      return true
    default:
      return true
  }
}
