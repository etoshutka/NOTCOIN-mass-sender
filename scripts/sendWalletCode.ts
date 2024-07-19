import { Cell, beginCell, contractAddress, toNano } from '@ton/core';
import { JettonDistributor } from '../wrappers/JettonDistr';
import { compile, NetworkProvider } from '@ton-community/blueprint';

const CONTRACT_ADDRESS: string = ""
const WALLET_CODE_HASH: Cell = beginCell()
                                    .storeRef("a760d629d5343e76d045017d9dc216fc8a307a8377815feb2b0a5c490e733486")
                                .endCell();

export async function run(provider: NetworkProvider) {
     const jettonDistributor = provider.open(JettonDistributor.createFromAddress(contractAddress));
        await jettonDistributor.sendSetJettonWalletCode(provider.sender(), {
            value: toNano('0.05'),
             jettonWalletCode: WALLET_CODE_HASH,
          });
}