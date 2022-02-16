import {
  web3,
  setProvider,
  BN,
  Program,
  Provider
} from '@project-serum/anchor'

import { bigInt } from 'snarkjs'

import idl from './otter_cash_idl.json'

const NETWORK = 'devnet'
const OTTER_PROGRAM_ID = new web3.PublicKey(
  'otterM8AATqnFXFNcPoWxTix75wou9A47xt6JbZxzS3'
)
const provider = Provider.local(
  web3.clusterApiUrl(NETWORK),
  { commitment: 'confirmed', preflightCommitment: 'confirmed' }
)
setProvider(provider)
// @ts-ignore
const program = new Program(idl, OTTER_PROGRAM_ID)

async function getMerkleState (): Promise<[web3.PublicKey, number]> {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from('merkle')],
    OTTER_PROGRAM_ID
  )
}

function u256BuffToLittleEndianBN (buff: Buffer): BN[] {
  if (buff.length !== 32) {
    throw Error('Unreachable.')
  }
  return [
    new BN(bigInt.beBuff2int(buff.slice(24, 32))),
    new BN(bigInt.beBuff2int(buff.slice(16, 24))),
    new BN(bigInt.beBuff2int(buff.slice(8, 16))),
    new BN(bigInt.beBuff2int(buff.slice(0, 8)))
  ]
}

export async function withdrawInit (proof): Promise<web3.PublicKey> {
  const [merkleState, merkleStateBump] = await getMerkleState()
  const proofArray: BN[][] = []
  for (let i = 0; i < 8; i++) {
    const thisProofPoint = Buffer.from(proof.proof.slice(2 + 64 * i, 2 + 64 * (i + 1)), 'hex')
    proofArray.push(u256BuffToLittleEndianBN(thisProofPoint))
  }

  // Swap (2, 3) and (4, 5) because Ethereum uses a different encoding of G2
  // points than ZCash BN library.
  const tmp1 = proofArray[2]
  proofArray[2] = proofArray[3]
  proofArray[3] = tmp1
  const tmp2 = proofArray[4]
  proofArray[4] = proofArray[5]
  proofArray[5] = tmp2

  const withdrawState = web3.Keypair.generate()
  await program.rpc.withdrawInit(
    merkleStateBump,
    proofArray,
    u256BuffToLittleEndianBN(Buffer.from(proof.publicSignals[0].slice(2), 'hex')),
    u256BuffToLittleEndianBN(Buffer.from(proof.publicSignals[1].slice(2), 'hex')),
    u256BuffToLittleEndianBN(Buffer.from(proof.publicSignals[2].slice(2), 'hex')),
    u256BuffToLittleEndianBN(Buffer.from(proof.publicSignals[3].slice(2), 'hex')),
    u256BuffToLittleEndianBN(Buffer.from(proof.publicSignals[4].slice(2), 'hex')),
    u256BuffToLittleEndianBN(Buffer.from(proof.publicSignals[5].slice(2), 'hex')),
    {
      accounts: {
        withdrawState: withdrawState.publicKey,
        merkleState: merkleState,
        user: program.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      },
      signers: [withdrawState]
    }
  )
  return withdrawState.publicKey
}
