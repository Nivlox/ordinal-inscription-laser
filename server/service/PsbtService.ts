import {
  script,
  Psbt,
  initEccLib,
  networks,
  Signer as BTCSigner,
  payments,
  opcodes,
  address as Address
} from "bitcoinjs-lib";
import dotenv from "dotenv"
dotenv.config();
import { Taptree } from "bitcoinjs-lib/src/types";
import ecc from "@bitcoinerlab/secp256k1";
import axios, { AxiosResponse } from "axios";
import cbor from 'cbor'
import { OPENAPI_UNISAT_URL, OPENAPI_UNISAT_TOKEN } from "../config/config";

const network = networks.testnet;
initEccLib(ecc as any);
initEccLib(ecc as any);
const metadata = {
  'type': 'Bitmap',
  'description': 'Bitmap Community Parent Ordinal'
}
const metadataBuffer = cbor.encode(metadata);
const transaction_fee = 5000;
const pointers = [546, 1092, 1638, 2184, 2730];

let pointerBuffer = pointers.map(pointer => {
  return Buffer.from(pointer.toString(16).padStart(4, '0'), 'hex').reverse();
});

const splitBuffer = (buffer: Buffer, chunkSize: number) => {
  let chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
};

export const contentBuffer = (content: string) => {
  return Buffer.from(content, 'utf8')
}
export async function createparentInscriptionTapScript(ordinalPubKey: string, imgData: any) {
  const contentBufferData: Buffer = contentBuffer(imgData.dataURL);
  const contentBufferArray: Array<Buffer> = splitBuffer(contentBufferData, 400)
  let parentOrdinalStacks: any = [
    Buffer.from(ordinalPubKey, "hex").slice(1, 33),
    opcodes.OP_CHECKSIG,
  ];
  parentOrdinalStacks.push(
    opcodes.OP_FALSE,
    opcodes.OP_IF,
    Buffer.from("ord", "utf8"),
    1,
    1,
    Buffer.concat([Buffer.from("text/html;charset=utf-8", "utf8")]),
    1,
    2,
    pointerBuffer,
    1,
    5,
    metadataBuffer,
    1,
    7,
    Buffer.concat([Buffer.from("chubby.cheek", "utf8")]),
    opcodes.OP_0,
  );
  contentBufferArray.forEach((item: Buffer) => {
    parentOrdinalStacks.push(item)
  })
  parentOrdinalStacks.push(opcodes.OP_ENDIF)

  return parentOrdinalStacks;
}

export async function parentInscribe(ordinalAddress: string,
  ordinalPubKey: string, imgData: any) {
  const parentOrdinalStack = await createparentInscriptionTapScript(ordinalPubKey, imgData);

  const ordinal_script = script.compile(parentOrdinalStack);
  const scriptTree: Taptree = {
    output: ordinal_script,
  };

  const redeem = {
    output: ordinal_script,
    redeemVersion: 192,
  };

  const ordinal_p2tr = payments.p2tr({
    internalPubkey: toXOnly(Buffer.from(ordinalPubKey, "hex")),
    network,
    scriptTree,
    redeem,
  });

  const internalPubKeyHex = Buffer.from(ordinalPubKey).toString('hex');
  let change: number = 0;
  const utxos = await getBtcUtxoByAddress(ordinalAddress as string);
  const psbt = new Psbt({ network });

  for (const utxo of utxos) {
    if (utxo.value > 40000) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        tapInternalKey: Buffer.from(ordinalPubKey, "hex").subarray(1, 33),
        witnessUtxo: { value: utxo.value, script: Buffer.from(utxo.scriptpubkey as string, "hex") },
        tapLeafScript: [
          {
            controlBlock: ordinal_p2tr.witness![ordinal_p2tr.witness!.length - 1],
            leafVersion: 192,
            script: ordinal_script,
          },
        ],
      });
      change = parseInt(utxo.value.toString()) - 546 - parseInt(transaction_fee.toString());
      break;
    }
  }

  psbt.addOutput({
    address: ordinalAddress, //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: ordinalAddress, // Change address
    value: change,
  });
  return psbt;
}


export async function signAndSend(
  psbtHex: string,
  signedPsbtHex: string
) {
  const psbt = Psbt.fromHex(psbtHex);
  const signedPsbt = Psbt.fromHex(signedPsbtHex);
  psbt.combine(signedPsbt);
  psbt.finalizeAllInputs()
  const tx = psbt.extractTransaction();
  const txid = await broadcast(tx.toHex());
  console.log(`Success! Txid is ${txid}`);
}

export const getBtcUtxoByAddress = async (address: string) => {
  const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/utxo-data`;

  const config = {
    headers: {
      Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
    },
  };

  let cursor = 0;
  const size = 5000;
  const utxos: IUtxo[] = [];

  while (1) {
    const res = await axios.get(url, { ...config, params: { cursor, size } });

    if (res.data.code === -1) throw "Invalid Address";

    utxos.push(
      ...(res.data.data.utxo as any[]).map((utxo) => {
        return {
          scriptpubkey: utxo.scriptPk,
          txid: utxo.txid,
          value: utxo.satoshi,
          vout: utxo.vout,
        };
      })
    );

    cursor += res.data.data.utxo.length;

    if (cursor === res.data.data.total - res.data.data.totalRunes) break;
  }
  return utxos;
}
export async function getTx(id: string): Promise<string> {
  const response: AxiosResponse<string> = await blockstream.get(
    `/tx/${id}/hex`
  );
  return response.data;
}

const blockstream = new axios.Axios({
  baseURL: `https://mempool.space/testnet/api`,
  // baseURL: `https://mempool.space/api`,
});

export async function broadcast(txHex: string) {
  const response: AxiosResponse<string> = await blockstream.post("/tx", txHex);
  return response.data;
}

function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33);
}

interface IUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}
export interface IUtxo {
  txid: string;
  vout: number;
  value: number;
  scriptpubkey?: string;
}