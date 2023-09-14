# Naifu Telegram Local Bot
 
Simple telegram bot to connect your local Naifu environemnt (well, the old novelAI) if you run in your own PC (using your own GPU).\
Currently no plan to migrate to use Automatic 1111's API. You can change it youself.\
You can also do some adjustment to connect to the the official Novel Ai Diffusion.\
\
To run it, first add your Telegram Bot token in .env file
```
TOKEN='<your token>'
BASE_URL='<your AI api>'
```
Then use `yarn build` or `npm run build` to start the program (or click the `run.bat`)

---

Input
---
use ```/prompt``` in message along with:\
`positive:` prompt\
`negative:` prompt\
`sizes:` small | medium | large | largest | big | big2 (or define it by yourself in config file)\
`orientation:` portrait | landscape | square\
`steps:` number\
`scale:` number\
`seed:` number (only support when using exact seed button)\
`save` 1 | 0 to save in server and send as png document\
`limit` 1 | 0 restict max size (telegram has a upper limit of 1280)\
works for i2i:\
`strength:` number\
`noise:` number\
`upscaler:` number


\
Each input options must be separated by newline, or it will be considered as same property\
e.g. 
```
/prompt
positive: something...
negative: something...
scale: 7
steps: 28
size: big
```
\
Support default negative prompt.

There are some other commands with different usage, please see source code.

\
For img2img, choose an image and input the caption with same format.\
Oversize image will be adjusted to smaller size.\
\
<img src="./src/asset/001.png" width="512">\
\
<img src="./src/asset/002.png" width="512">\
\
<img src="./src/asset/003.png" width="512">\
\
<img src="./src/asset/004.png" width="512">\
\
<img src="./src/asset/005.png" width="512">