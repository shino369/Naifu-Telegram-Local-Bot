import { Config } from '../types.js'

export const config: Config = {
  generateImageURL: '/generate-stream',
  sizeMapper: {
    portrait: {
      medium: {
        height: 768,
        width: 512,
      },
      large: {
        height: 1024,
        width: 512,
      },
      small: {
        height: 640,
        width: 384,
      },
      big: {
        height: 960,
        width: 640,
      },
      big2: {
        height: 960,
        width: 512,
      },
      largest: {
        height: 1152,
        width: 768,
      },
    },
    landscape: {
      medium: {
        height: 512,
        width: 768,
      },
      large: {
        height: 512,
        width: 1024,
      },
      small: {
        height: 384,
        width: 640,
      },
      big: {
        height: 640,
        width: 960,
      },
      big2: {
        height: 512,
        width: 960,
      },
      largest: {
        height: 768,
        width: 1152,
      },
    },
    square: {
      medium: {
        height: 640,
        width: 768,
      },
      large: {
        height: 1024,
        width: 1024,
      },
      small: {
        height: 640,
        width: 512,
      },
      big: {
        height: 960,
        width: 768,
      },
      big2: {
        height: 1024,
        width: 768,
      },
      largest: {
        height: 1152,
        width: 1152,
      },
    },
  },
  default: {
    positive: 'masterpiece, best quality, ',
    negative: {
      default:
        'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, ',
      long: '(((ugly))), (((duplicate))), (((morbid))), (((mutilated))), (((tranny))), (((trans))), (((transsexual))), (hermaphrodite), [out of frame], extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), bad anatomy, bad hands, text, missing fingers, signature, watermark, username multiple breasts, (mutated hands and fingers:1.5 ), (long body :1.3), (mutation, poorly drawn :1.2), bad anatomy, liquid body, liquid tongue, disfigured, malformed, mutated, anatomical nonsense, text font ui, error, malformed hands, long neck, blurred, lowers, lowres, bad anatomy, bad proportions, bad shadow, uncoordinated body, unnatural body, fused breasts, bad breasts, huge breasts, poorly drawn breasts, extra breasts, liquid breasts, heavy breasts, missing breasts, huge haunch, huge thighs, huge calf, bad hands, fused hand, missing hand, disappearing arms, disappearing thigh, disappearing calf, disappearing legs, fused ears, bad ears, poorly drawn ears, extra ears, liquid ears, heavy ears, missing ears, fused animal ears, bad animal ears, poorly drawn animal ears, extra animal ears, liquid animal ears, heavy animal ears, missing animal ears, text, ui, error, missing fingers, missing limb, fused fingers, one hand with more than 5 fingers, one hand with less than 5 fingers, one hand with more than 5 digit, one hand with less than 5 digit, extra digit, fewer digits, fused digit, missing digit, bad digit, liquid digit, colorful tongue, black tongue, cropped, watermark, username, blurry, JPEG artifacts, signature, malformed feet, extra feet, bad feet, poorly drawn feet, fused feet, missing feet, extra shoes, bad shoes, fused shoes, more than two shoes, poorly drawn shoes, bad gloves, poorly drawn gloves, fused gloves, bad cum, poorly drawn cum, fused cum, bad hairs, poorly drawn hairs, fused hairs, big muscles, ugly, bad face, fused face, poorly drawn face, cloned face, big face, long face, bad eyes, fused eyes poorly drawn eyes, extra eyes, malformed limbs, more than 2 nipples, missing nipples, different nipples, fused nipples, bad nipples, poorly drawn nipples, black nipples, colorful nipples, gross proportions. short arm, (((missing arms))), missing thighs, missing calf, missing legs, mutation, duplicate, morbid, mutilated, poorly drawn hands, more than 1 left hand, more than 1 right hand, deformed, (blurry), disfigured, missing legs, extra arms, extra thighs, more than 2 thighs, extra calf, fused calf, extra legs, bad knee, extra knee, more than 2 legs, bad tails, bad mouth, fused mouth, poorly drawn mouth, more than 2 legs',
      mid: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, (((ugly))), (((duplicate))), (((morbid))), (((mutilated))), (((tranny))), (trans), (hermaphrodite), [out of frame], extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), bad anatomy, bad hands, text, missing fingers, fused fingers, one hand with more than 5 fingers, one hand with less than 5 fingers, signature, watermark, username, multiple breasts, (long body :1.3), bad anatomy, malformed, mutated, malformed hands, long neck, blurred, lowers, lowres, bad anatomy, uncoordinated body, unnatural body, fused breasts, bad breasts, huge breasts, poorly drawn breasts, extra breasts, more than 2 nipples, missing nipples, bad eyes, fused eyes, poorly drawn eyes, bad shoes, fused shoes, more than two shoes, poorly drawn shoes, malformed feet,',
      none: '',
    },
    orientation: 'portrait',
    size: 'medium',
    strength: 0.7,
    noise: 0.2,
    steps: 28,
    img2imgStep: 50,
    scale: 11,
  },
  cooltime: 20,
}
