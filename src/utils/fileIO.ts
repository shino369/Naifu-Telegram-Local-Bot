import fs from 'fs'
import { color } from './functions.js'

export function getJsonFileFromPath(filePath: string) {
  let newJson
  try {
    // for saving setting
    if (fs.existsSync(filePath)) {
      const json = fs.readFileSync(filePath)
      if (json && json.toString().length > 0) {
        newJson = JSON.parse(json.toString())
      }
    }
  } catch (e) {
    console.error(e)
    console.error('Error: error when getting setting')
  } finally {
    return newJson
  }
}

export function getconfigById(filePath: string, id: string) {
  let match
  try {
    // for saving setting
    if (fs.existsSync(filePath)) {
      const unparsedArr = fs.readFileSync(filePath).toString().split('||')
      // console.log(unparsedArr)
      if (unparsedArr.length > 0) {
        match = unparsedArr
          .filter(f => f !== '')
          .map(arr => JSON.parse(arr))
          .find(json => json.configId === id)
      }
    }
  } catch (e) {
    console.error(e)
    console.error('Error: error when getting setting')
  } finally {
    return match
  }
}

export function writeJsonFileFromPath(
  filePath: string,
  data: Object,
  append?: boolean,
) {
  try {
    if (append) {
      fs.promises
        .appendFile(filePath, ',' + JSON.stringify(data, undefined, 2)) //create ,{},{}.....
        .then(res => console.log(color('text', 'new log appended')))
    } else {
      fs.promises
        .writeFile(filePath, JSON.stringify(data, undefined, 2))
        .then(res =>
          console.log(
            color('text', 'file written'),
            JSON.stringify(data, undefined, 2),
          ),
        )
    }
  } catch (e) {
    console.error(e)
    console.error('Error: error when writting setting')
  }
}
