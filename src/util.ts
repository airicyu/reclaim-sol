import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import web3, {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

const PRIORITY_RATE = 10; // MICRO_LAMPORTS
const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: PRIORITY_RATE,
});

export async function getAllTokenAccounts(
  connection: web3.Connection,
  ownerAddress: PublicKey
) {
  return connection.getParsedTokenAccountsByOwner(ownerAddress, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });
}

export async function closeTokenAccount(
  connection: web3.Connection,
  sendConnection: web3.Connection,
  wallet: Keypair,
  tokenAccounts: PublicKey[]
) {
  const txHashes: string[] = [];
  const ownerAddress = wallet.publicKey;

  let loopCount = Math.ceil(tokenAccounts.length / 25);

  for (let i = 0; i < loopCount; i++) {
    let batch = tokenAccounts.slice(i * 25, i * 25 + 25);

    let latestBlockHash = await connection.getLatestBlockhash({
      commitment: "finalized",
    });

    const messageV0 = new TransactionMessage({
      payerKey: ownerAddress,
      recentBlockhash: latestBlockHash.blockhash,
      instructions: [
        PRIORITY_FEE_IX,
        ...batch.map((tokenAccount) =>
          createCloseAccountInstruction(
            tokenAccount,
            ownerAddress,
            ownerAddress,
            [],
            TOKEN_PROGRAM_ID
          )
        ),
      ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign([wallet]);
    const txHash = await sendConnection.sendTransaction(tx, {
      skipPreflight: true,
    });
    console.log(
      `View the transaction at: https://explorer.solana.com/tx/${txHash}`
    );
    await connection.confirmTransaction(
      {
        signature: txHash,
        ...latestBlockHash,
      },
      "confirmed"
    );
    txHashes.push(txHash);
  }

  return txHashes;
}
