import { config } from '../constant/config.js'
import { queuingCache } from '../index.js'
import Context from 'telegraf/typings/context'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Telegraf } from 'telegraf/typings/telegraf'
import { T2ImgConfig, UserConfig } from '../types.js'
import {
  writeJsonFileFromPath,
  getEditmsgStr,
  getInlinKeyboard,
  returnDefaultWithNewSeed,
  color,
  validate,
  getconfigById,
  switchModel,
  findProcess,
  getToken,
} from '../utils/index.js'

const PROMPT = 'prompt'
const GETCONFIG = 'getconfig'
const SETNEGATIVE = 'negative'
const GETNEGATIVE = 'getnegative'
const CHANGE = 'change'
const CURRENT = 'current'
const SAMPLE = 'sample'

const prompt = (bot: Telegraf<Context<Update>>) => {
  bot.command(PROMPT, async ctx => {
    const userId = ctx.message.from.id

    // check if exist in queue
    // if (queuingCache.getQueue().find(userConfig => userConfig.id === userId)) {
    //   console.log(color('error', `previous job not finished`))
    //   return ctx.reply(
    //     `${
    //       ctx.message.from.first_name ? ` ${ctx.message.from.first_name}` : ''
    //     },  your previous job is still on the queue.`,
    //   )
    // }

    const inputArr = ctx.message.text
      .substring(PROMPT.length + 1)
      .split('\n')
      .map(arr => arr.trim())
      .filter(arr => arr !== '')

    const defaultSetting = returnDefaultWithNewSeed()

    const newSetting: any = {}

    const settingKeys: (keyof T2ImgConfig)[] = [
      ...(Object.keys(defaultSetting) as (keyof T2ImgConfig)[]),
    ]

    settingKeys.forEach(key => {
      const match = inputArr.find(f =>
        f.toUpperCase().includes(`${key.toUpperCase()}:`),
      )
      if (match) {
        if (!validate(key, match)) {
          console.log(color('error', `wrong format for ${key}`))
          return
        }

        newSetting[key] = match.substring(key.length + 1).trim() as any
      }
    })

    const newJob: UserConfig = {
      ...ctx.update.message.from,
      status: '',
      number: -1,
      config: {
        ...defaultSetting,
        ...newSetting,
        positive: newSetting.positive
          ? defaultSetting.positive + newSetting.positive
          : defaultSetting.positive,
        negative: newSetting.negative
          ? defaultSetting.negative + newSetting.negative
          : defaultSetting.negative,
        seed: newSetting.seed ? newSetting.seed : defaultSetting.seed,
      },
    }

    // push to pre-queue
    // queuingCache.pushPreQueue(newJob)

    // write log
    // writeJsonFileFromPath('./log/log.json', newJob, true)
    let str = newJob.config.positive
    const arrs = ['{','}','[',']']
    arrs.map((arr) => {
        str =  str.replaceAll(arr,'')
        return
    })
    const tokens = getToken(str)
    console.log(tokens)
    return ctx.reply(getEditmsgStr(newJob), {
      reply_markup: getInlinKeyboard(),
    })
  })

  bot.command(GETCONFIG, async ctx => {
    const configId = ctx.message.text.substring(GETCONFIG.length + 1).trim()

    const oldConfig: UserConfig = getconfigById('./log/log.json', configId)

    if (oldConfig) {
      return ctx.reply(getEditmsgStr(oldConfig), {
        reply_markup: getInlinKeyboard(),
      })
    } else {
      return ctx.reply(`Error: config with id: [${configId}] not found`)
    }
  })

  bot.command(SETNEGATIVE, async ctx => {
    const negative = ctx.message.text.substring(SETNEGATIVE.length + 1).trim()
    const negativeObj = {
      negative: negative,
      model: queuingCache.getCurrentModel(),
    }

    if (
      negative === 'default' ||
      negative === 'long' ||
      negative === 'mid' ||
      negative === 'none'
    ) {
      writeJsonFileFromPath('./store.json', negativeObj)
      queuingCache.setNegativeSetting(negative)
      return ctx.reply('Setting applied')
    } else {
      return ctx.reply(`Error: negative with string: [${negative}] not found`)
    }
  })

  bot.command(GETNEGATIVE, async ctx => {
    const negative = ctx.message.text.substring(GETNEGATIVE.length + 1).trim()

    if (
      negative === 'default' ||
      negative === 'long' ||
      negative === 'mid' ||
      negative === 'none'
    ) {
      return ctx.reply(config.default.negative[negative])
    } else {
      return ctx.reply(`Error: negative with string: [${negative}] not found`)
    }
  })

  bot.command(CHANGE, async ctx => {
    const modelName = ctx.message.text.substring(CHANGE.length + 1).trim()
    queuingCache.switchModelByName(modelName, ctx.message.chat.id)

    return ctx.reply('Switching model... Please wait...')
  })

  bot.command(SAMPLE, async ctx => {
    const samplingStr = ctx.message.text.substring(SAMPLE.length + 1).trim()
    if (samplingStr.length === 1) {
      const sampling = parseInt(samplingStr[0])
      const samp = queuingCache.setSampling(sampling)

      return ctx.reply(`Sampling set to ${samp}`)
    } else {
      return ctx.reply(
        `Wrong format. Available: 0 - k_euler_ancestral | 1 - k_euler | 2 - ddim`,
      )
    }
  })

  // bot.command(CURRENT, async ctx => {
  //   findProcess('name', 'cmd.exe').then(
  //     res => {
  //       const target = res.find(arr => arr.cmd.includes('/K start'))
  //       if (target) {
  //         return ctx.reply(target.cmd)
  //       } else {
  //         return ctx.reply('no process running')
  //       }
  //     },
  //     err => {
  //       return ctx.reply('Error: cmd not found')
  //     },
  //   )
  //   // if (negative === 'default' || negative === 'long' ||  negative === 'mid' || negative === 'none') {
  //   //   return ctx.reply(config.default.negative[negative])
  //   // } else {
  //   //   return ctx.reply(`Error: negative with string: [${negative}] not found`)
  //   // }
  // })
}

export default prompt
