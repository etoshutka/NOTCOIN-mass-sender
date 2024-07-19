import { Address, toNano } from 'ton-core';
import { MassSender, Msg, calculateJettonWalletAddress } from '../wrappers/MassSender';
import { compile, NetworkProvider } from '@ton-community/blueprint';

interface RawMessage {
    [key: string]: string;
}

export async function process(provider: NetworkProvider, messages: Msg[], jettonMaster: Address) {
    const massSender = provider.open(
        MassSender.createFromConfig(
            {
                messages,
                admin: provider.sender().address!,
                jettonMaster: jettonMaster
            },
            await compile('MassSender')
        )
    );

    const totalFees = toNano('0.1') * BigInt(messages.length);

    await massSender.sendDeploy(
        provider.sender(),
        totalFees
    );

    await provider.waitForDeploy(massSender.address);
}

export async function run(provider: NetworkProvider) {
    let rawMessages: RawMessage = require('./transactions.json');
    let messages: Msg[] = [];
    const jettonMaster = Address.parse('kQA25YwnFEi0h-i5e0x8rid4z7IS_c0gpR9AIvzcpKX8qVlc'); // Замените на реальный адрес jetton-мастера

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