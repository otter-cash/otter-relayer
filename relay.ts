import express from 'express'
const app = express()

app.get('/', (req: express.Request, res: express.Response): void => {
  res.send('Hello world!')
})

app.listen(443)
