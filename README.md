# Naifu Telegram Local Bot
 
Simple telegram bot to connect your local Naifu environemnt (using your own GPU).\
\
`Does not work for webui as it use the backend API from naifu.`\
use /prompt in message along with:\
`positive:` prompt\
`negative:` prompt\
`sizes:` small | medium | large\
`orientation:` portrait | landscape\
`step:` number\
`scale:` number\
`strength:` number\
`noise:` number\
\
Each input options must be separated by newline, or it will be considered as same property\
e.g. 
```
/prompt
positive: something...
negative: something...
scale: 7
```
For img2img, choose an image and input the caption with same format.