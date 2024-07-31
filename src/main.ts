import web3, { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { getAllTokenAccounts, closeTokenAccount } from "./util.js";

const connection = new web3.Connection(
  web3.clusterApiUrl("mainnet-beta"),
  "confirmed"
);
const sendConnection = new web3.Connection(
  // web3.clusterApiUrl("mainnet-beta"),
  "https://wallet-api.solflare.com/v2/tx/rpc/mainnet",
  // "https://swr.xnftdata.com/rpc-proxy/",
  "confirmed"
);

const privateKey = Uint8Array.from(bs58.decode("").slice(0, 32));

const wallet = Keypair.fromSeed(privateKey);

let zeroBalanceTokens = (
  await getAllTokenAccounts(connection, wallet.publicKey)
).value
  .filter(
    (tokenItem) =>
      // tokenItem.account.data.program === "spl-token" &&
      tokenItem.account.data.parsed.info.tokenAmount.uiAmountString === "0"
  )
  .map((tokenItem) => {
    return {
      mint: tokenItem.account.data.parsed.info.mint,
      tokenAccount: tokenItem.pubkey.toString(),
    };
  });
console.log(zeroBalanceTokens);

const txHashes = await closeTokenAccount(
  connection,
  sendConnection,
  wallet,
  zeroBalanceTokens.map((_) => new PublicKey(_.tokenAccount))
);

console.log("Transactions sent & confirmed!");

txHashes.forEach((txHash) => {
  console.log(
    `View the transaction at: https://explorer.solana.com/tx/${txHash}`
  );
});
