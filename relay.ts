import express from 'express'
import { parse } from 'ts-command-line-args'

import { withdrawInit } from './contract'

const app = express()

// Parse CLI args.
type Network = 'devnet' | 'testnet' | 'mainnet'
interface RelayerArguments {
  fee: number
  address: string
  network: Network
  port?: number
}
function parseNetwork (value?: string): Network {
  if (value !== 'devnet' && value !== 'testnet' && value !== 'mainnet') {
    throw new Error(`Invalid network: ${value}`)
  }
  return value as Network
}
export const args = parse<RelayerArguments>({
  fee: Number,
  address: String,
  network: parseNetwork,
  port: { type: Number, optional: true }
})

// Set the default args.
if (!args.port) {
  args.port = 2008
}

console.log('args:', args)

app.use(express.json())
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// Set up routes.
app.get('/feeAndAddress', (req: express.Request, res: express.Response): void => {
  console.log('GET /feeAndAddress')
  res.send({ fee: args.fee, address: args.address })
})

app.post('/relay', async (req: express.Request, res: express.Response): Promise<void> => {
  console.log('POST /relay')
  const withdrawState = await withdrawInit(req.body)
  res.send({
    ok: true,
    err: null,
    withdrawState: withdrawState.toString()
  })
})

// Serve.
app.listen(args.port)
