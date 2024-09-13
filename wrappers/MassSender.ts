import { sleep } from '@ton-community/blueprint';
import { TonClient } from '@ton/ton';
import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    DictionaryValue,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';

export type Msg = {
    value: bigint;
    destination: Address;
    jettonWallet: Address;
};

export type MassSenderConfig = {
    messages: Msg[];
    total?: bigint;
    admin: Address;
    jettonMaster: Address;
};

function createMessageValue(): DictionaryValue<Msg> {
    return {
        serialize: (src, builder) => {
            builder
                .storeCoins(src.value)
                .storeAddress(src.destination)
                .storeAddress(src.jettonWallet);
        },
        parse: (src) => {
            return {
                value: src.loadCoins(),
                destination: src.loadAddress(),
                jettonWallet: src.loadAddress()
            };
        },
    };
};

function messagesToDict(messages: Msg[]): Dictionary<number, Msg> {
    let dict = Dictionary.empty(Dictionary.Keys.Uint(16), createMessageValue());
    for (let i = 1; i <= messages.length; i++) {
        dict.set(i, messages[i - 1]);
    }
    return dict;
}

export function massSenderConfigToCell(config: MassSenderConfig): Cell {
    return beginCell()
        .storeUint(Date.now(), 64)
        .storeCoins(
            config.total !== undefined ? config.total : config.messages.map((msg) => msg.value).reduce((a, b) => a + b)
        )
        .storeUint(config.messages.length, 16)
        .storeUint(0, 16)
        .storeUint(0, 1)
        .storeUint(0, 1) // ready_to_send
        .storeAddress(config.admin)
        .storeDict(messagesToDict(config.messages))
        .storeAddress(config.jettonMaster)
        .endCell();
}

export class MassSender implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MassSender(address);
    }

    static createFromConfig(config: MassSenderConfig, code: Cell, workchain = 0) {
        const data = massSenderConfigToCell(config);
        const init = { code, data };
        return new MassSender(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Cell.EMPTY,
        });
    }

    async sendProcessMessages(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x23456789, 32)
                .endCell(),
        });
    }

    async sendWithdrawRemaining(provider: ContractProvider, via: Sender, params: { value: bigint }) {
        await provider.internal(via, {
            value: params.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x12345678, 32)
                .endCell(),
        });
    }

    async sendStartSending(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x87654321, 32).endCell(),
        });
    }

    async getHasFinished(provider: ContractProvider): Promise<boolean> {
        const result = await provider.get('has_finished', []);
        return result.stack.readBoolean();
    }

    async getIsReadyToSend(provider: ContractProvider): Promise<boolean> {
        const result = await provider.get('is_ready_to_send', []);
        return result.stack.readBoolean();
    }
}

export async function calculateJettonWalletAddress(minterAddress: string, ownerAddress: Address): Promise<Address> {
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
        }
    ]);
    return response.stack.readAddress();
}