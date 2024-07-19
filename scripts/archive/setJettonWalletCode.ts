import { Address, toNano, Cell } from '@ton/core';
import { compile, NetworkProvider, sleep } from '@ton-community/blueprint';
import { TonClient } from '@ton/ton';
import { JettonDistributor } from '../wrappers/JettonDistr'

const JETTON_MINTER_ADDRESS: string = "kQA25YwnFEi0h-i5e0x8rid4z7IS_c0gpR9AIvzcpKX8qVlc";

async function getJettonData(minterAddress: string): Promise<{ totalSupply: bigint, int:bigint, adminAddress: Address, content: Cell, walletCode: Cell }> {
    const client = new TonClient({
        endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    });
    
    await sleep(1500);
    const response = await client.runMethod(Address.parse(minterAddress), "get_jetton_data", []);
    
    const totalSupply = response.stack.readBigNumber();
    const int = response.stack.readBigNumber();
    const adminAddress = response.stack.readAddress();
    const content = response.stack.readCell();
    const walletCode = response.stack.readCell();

    return {
        totalSupply,
        int,
        adminAddress,
        content,
        walletCode
    };
}

(async () => {
    try {
        const jettonData = await getJettonData(JETTON_MINTER_ADDRESS);
        console.log('Jetton Data:');
        console.log('Total Supply:', jettonData.totalSupply.toString());
        console.log('Int', jettonData.int.toString() )
        console.log('Admin Address:', jettonData.adminAddress.toString());
        console.log('Content Hash:', jettonData.content.hash().toString('hex'));
        console.log('Wallet Code Hash:', jettonData.walletCode.hash().toString('hex'));

        // Если вам нужно отправить код кошелька в ваш контракт JettonDistributor:
         // const jettonDistributor = provider.open(JettonDistributor.createFromAddress(jettonDistributorAddress));
         // await jettonDistributor.sendSetJettonWalletCode(provider.sender(), {
            // value: toNano('0.05'),
            // jettonWalletCode: jettonData.walletCode,
         // });
         console.log('Jetton wallet code set for JettonDistributor');
    } catch (error) {
        console.error('Error getting Jetton data:', (error as Error).message);
    }
})();