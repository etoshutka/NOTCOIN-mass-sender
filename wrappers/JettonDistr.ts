import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, DictionaryValue, Sender, SendMode } from '@ton/core';

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

export type JettonDistributorConfig = {
    messages: Msg[];
    total?: bigint;
    admin: Address;
    jettonMaster: Address;
    jettonWalletCode: Cell;
};

export function jettonDistributorConfigToCell(config: JettonDistributorConfig): Cell {
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
        .storeRef(config.jettonWalletCode) // empty jetton_wallet_code
    .endCell();
}

export class JettonDistributor implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonDistributor(address);
    }

    static createFromConfig(config: JettonDistributorConfig, code: Cell, workchain = 0) {
        const data = jettonDistributorConfigToCell(config);
        const init = { code, data };
        return new JettonDistributor(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
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

    async sendSetJettonWalletCode(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            jettonWalletCode: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x54321678, 32)
                .storeRef(opts.jettonWalletCode)
            .endCell(),
        });
    }

    async sendStartSending(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x87654321, 32)
            .endCell(),
        });
    }

    async sendWithdrawRemaining(provider: ContractProvider, via: Sender, params: { value: bigint, amount: bigint }) {
        await provider.internal(via, {
            value: params.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x12345678, 32)
                .storeCoins(params.amount)
                .endCell(),
        });
    }

    async sendWithdrawTons(provider: ContractProvider, via: Sender, params: { value: bigint }) {
        await provider.internal(via, {
            value: params.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x34567890, 32)
                .endCell(),
        });
    }
    
    async getHasFinished(provider: ContractProvider) {
        const result = await provider.get('has_finished', []);
        return result.stack.readBoolean();
    }

    async getIsReadyToSend(provider: ContractProvider) {
        const result = await provider.get('is_ready_to_send', []);
        return result.stack.readBoolean();
    }
}