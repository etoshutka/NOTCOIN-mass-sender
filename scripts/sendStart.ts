import { Address, toNano } from '@ton/core';
import { JettonDistributor } from '../wrappers/JettonDistr';
import { NetworkProvider } from '@ton/blueprint';

// Адрес развернутого контракта
const MASS_SENDER_ADDRESS = 'EQD-vnpLofw2JK6Ne4yZRRSyFnlR8wP0_V9F7Efx3NCw34NM';

export async function run(provider: NetworkProvider) {
    const massSenderAddress = Address.parse(MASS_SENDER_ADDRESS);
    const massSender = provider.open(JettonDistributor.createFromAddress(massSenderAddress));

    console.log(`Initiating sending process for MassSender at ${MASS_SENDER_ADDRESS}`);
    
    // Отправляем достаточно TON для оплаты комиссий за обработку сообщений
    await massSender.sendProcessMessages(provider.sender(), toNano('1'));
    console.log('Process messages initiated.');
}