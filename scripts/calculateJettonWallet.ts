import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider, sleep } from '@ton-community/blueprint';
import { TonClient, TupleItemSlice, beginCell } from '@ton/ton';


const JETTON_MINTER_ADDRESS: string = "kQA25YwnFEi0h-i5e0x8rid4z7IS_c0gpR9AIvzcpKX8qVlc";
const BORROWER_ADDRESS: string = 'UQCeb909xRLezUdaPvwRS7UYd_KY8VOYaK_kEReuCskS1adp';

export async function calculateJettonWalletAddress(minterAddress: string, ownerAddress: Address): Promise<string> {

    const client = new TonClient({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
    });
    
    await sleep(1500);
    const response = await client.runMethod(Address.parse(minterAddress), "get_wallet_address", [
        {
            type: 'slice',
            cell: 
                beginCell()
                    .storeAddress(ownerAddress)
                .endCell()
        } as TupleItemSlice
    ])
    return response.stack.readAddress().toString();

}

(async () => {
    try {
        const walletAddress = await calculateJettonWalletAddress(JETTON_MINTER_ADDRESS, Address.parse(BORROWER_ADDRESS));
        console.log('Jetton Wallet Address:', walletAddress);
    } catch (error) {
        console.error('Error calculating jetton wallet address:', error);
    }
})();