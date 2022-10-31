import { User } from "telegraf/typings/core/types/typegram"

export interface SavedSetting {
  updatedAt: string
  data: {
    // user id
    [key in string]: {
      // slot 1 - 5
      [key in number]: Options
    }
  }
}

export interface Options {
  positivePrompt: string
  negativePrompt: string
  orientation: Orientation
  size: Size
  scale: number
  steps: number
  strength?: number
  noise?: number
}

export type Orientation = 'portrait' | 'landscape' | 'square'

export type Size = 'small' | 'medium' | 'large'

export interface Config {
  generateImageURL: string
  sizeMapper: {
    [key in Orientation]: {
      [key in Size]: {
        height: number
        width: number
      }
    }
  }
  default: {
    positive: string
    negative: string
    orientation: Orientation
    size: Size
    strength: number
    noise: number
    steps: number
    img2imgStep: number
    scale: number
  }
  cooltime: number
}

export interface Img2imgOptions {
  steps?: number
  strength?: number
  noise?: number
  image?: string // base64 string, very long
  width?: number
  height?: number
}

export interface Payload extends Img2imgOptions {
  width: number
  height: number
  prompt: string
  scale: number
  sampler: string
  seed: number
  n_samples: number
  ucPreset: number
  uc: string
}

export interface FileRes {
  name: string
  image: any
}

export interface UserConfig extends User {
  status: string
  number: number
  config: T2ImgConfig
  channelId? : number
  img?: {
    file: string
    width: number
    height: number
  }
}

export interface T2ImgConfig {
  positive: string
  negative: string
  orientation: Orientation
  size: Size
  scale: string
  steps: string
  strength: string
  noise: string
  seed: string
}
