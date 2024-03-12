import express from 'express'
import { parse } from 'ts-command-line-args'
import { web3, Wallet } from '@coral-xyz/anchor'

import {
  setAnchorProvider,
  withdrawInit,
  allWithdrawAdvance,
  withdrawFinalize
} from './contract'

const app = express()

// Parse CLI args.
type Network = 'devnet' | 'mainnet'
interface RelayerArguments {
  network: Network
  fee: number
  port?: number
}
function parseNetwork (value?: string): Network {
  if (value !== 'devnet' && value !== 'mainnet') {
    throw new Error(`Invalid network: ${value}`)
  }
  return value as Network
}
export const args = parse<RelayerArguments>({
  network: parseNetwork,
  fee: Number,
  port: { type: Number, optional: true }
})

// Set the default args.
if (!args.port) {
  args.port = 2008
}
console.log('args:', args)
setAnchorProvider(args.network)

app.use(express.json())
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// Set up routes.
app.get('/ping', (req: express.Request, res: express.Response): void => {
  res.send({ ok: true })
})

const walletAddress = Wallet.local().payer.publicKey.toString()
app.get('/feeAndAddress', (req: express.Request, res: express.Response): void => {
  console.log('GET /feeAndAddress')
  res.send({ fee: args.fee, address: walletAddress })
})

app.post('/relay', async (req: express.Request, res: express.Response): Promise<void> => {
  console.log('POST /relay')
  const proof = req.body
  const withdrawState = web3.Keypair.generate()
  res.send({
    ok: true,
    err: null,
    withdrawState: withdrawState.publicKey.toString()
  })
  try {
    await withdrawInit(withdrawState, proof)
    await allWithdrawAdvance(withdrawState)
    await withdrawFinalize(withdrawState, proof)
  } catch (err) {
    console.warn(err)
  }
})

// Serve.
app.listen(args.port!)
