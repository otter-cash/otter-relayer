import express from 'express'
import { parse } from 'ts-command-line-args'

const app = express()

// Parse CLI args.
type Network = 'devnet' | 'testnet' | 'mainnet'
interface RelayerArguments {
  fee: number
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
  network: parseNetwork,
  port: { type: Number, optional: true }
})

// Set the default args.
if (!args.port) {
  args.port = 2008
}

console.log('args:', args)

// Set up routes.
app.get('/fee', (req: express.Request, res: express.Response): void => {
  res.send(args.fee.toString() + '\n')
})

// Serve.
app.listen(args.port)
