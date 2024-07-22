import { Address, toNano, Cell, beginCell } from '@ton/core';
import { compile, NetworkProvider, sleep } from '@ton/blueprint';
import { JettonDistributor, Msg } from '../wrappers/JettonDistr'; 
import { TonClient } from '@ton/ton';
import { calculateJettonWalletAddress } from '../wrappers/MassSender';


const JETTON_MINTER_ADDRESS: string = "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT"; // Мастер-контракт жетона

async function getJettonData(minterAddress: string): Promise<{ 
    totalSupply: bigint, 
    int: bigint, 
    adminAddress: Address | null, 
    content: Cell, 
    walletCode: Cell 
}> {
    const client = new TonClient({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
    });
    
    await sleep(1500);
    const response = await client.runMethod(Address.parse(minterAddress), "get_jetton_data", []);
    
    const totalSupply = response.stack.readBigNumber();
    const int = response.stack.readBigNumber();
    let adminAddress: Address | null;
    try {
        adminAddress = response.stack.readAddress();
    } catch (error) {
        console.log("Admin address is not set (probably 0). Setting to null.");
        adminAddress = null;
    }
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

interface RawMessage {
    [key: string]: string;
}

export async function process(provider: NetworkProvider, messages: Msg[], jettonMaster: Address) {
    const jettonCode = await getJettonData(JETTON_MINTER_ADDRESS);
    console.log('Jetton Data:');
    console.log('Total Supply:', jettonCode.totalSupply.toString());
    console.log('Int', jettonCode.int.toString() )
    console.log('Admin Address:', jettonCode.adminAddress ? jettonCode.adminAddress.toString() : 'Not set');
    console.log('Content Hash:', jettonCode.content.hash().toString('hex'));
    console.log('Wallet Code Hash:', jettonCode.walletCode.hash().toString('hex'));
    
    const massSender = provider.open(
        JettonDistributor.createFromConfig(
            {
                messages,
                admin: provider.sender().address!,
                jettonMaster: jettonMaster,
                jettonWalletCode: jettonCode.walletCode
            },
            await compile('MassSender')
        )
    );

    const totalFees = toNano('0.1') // * BigInt(messages.length);

    await massSender.sendDeploy(
        provider.sender(),
        totalFees
    );

    await provider.waitForDeploy(massSender.address);
}

export async function run(provider: NetworkProvider) {
    let rawMessages: RawMessage = require('./transactions.json');
    let messages: Msg[] = [];
    const jettonMaster = Address.parse('EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT'); // Мастер-контракт жетона

    for (const [addr, amount] of Object.entries(rawMessages)) {
        const destination = Address.parse(addr);
        const jettonWallet = await calculateJettonWalletAddress(jettonMaster.toString(), destination);
        messages.push({
            value: BigInt(amount),
            destination: destination,
            jettonWallet: jettonWallet
        });
    }

    await process(provider, messages, jettonMaster);
}

/*
export async function (provider: NetworkProvider) {
    // Получаем код кошелька Jetton
    const jettonCode = await getJettonData(JETTON_MINTER_ADDRESS);
    console.log('Jetton Data:');
    console.log('Total Supply:', jettonCode.totalSupply.toString());
    console.log('Int', jettonCode.int.toString() )
    console.log('Admin Address:', jettonCode.adminAddress.toString());
    console.log('Content Hash:', jettonCode.content.hash().toString('hex'));
    console.log('Wallet Code Hash:', jettonCode.walletCode.hash().toString('hex'));

    const jettonDistributor = provider.open(JettonDistributor.createFromConfig({
        admin: provider.sender().address!,
        jettonMaster: Address.parse(JETTON_MINTER_ADDRESS), // Используем адрес Jetton мастера
        jettonWalletCode: jettonCode.walletCode , // Используем полученный код кошелька Jetton
    }, await compile('JettonDistr'))); // Убедитесь, что имя совпадает с вашим файлом контракта

    await jettonDistributor.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonDistributor.address);

    console.log('JettonDistributor deployed at', jettonDistributor.address);}

    */