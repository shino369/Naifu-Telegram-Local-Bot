import fs from 'fs'
import moment from 'moment'

export function getJsonFileFromPath(filePath: string) {
  const newDate = moment().format('YY-MM-DD-hh-mm-ss')
  let newJson = {}
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

export function writeJsonFileFromPath(filePath: string, data: Object, append?: boolean) {
  try {
    if(append) {
      fs.promises
      .appendFile(filePath, JSON.stringify(data, undefined, 2))
      .then(res => console.log('file written'))
    }else {
      fs.promises
      .writeFile(filePath, JSON.stringify(data, undefined, 2))
      .then(res => console.log('file written'))
    }

  } catch (e) {
    console.error(e)
    console.error('Error: error when writting setting')
  }
}
