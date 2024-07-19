import { Address, toNano } from 'ton-core';
import { JettonDistributor } from '../wrappers/JettonDistr';
import { NetworkProvider } from '@ton-community/blueprint';

// Адрес развернутого контракта MassSender
const MASS_SENDER_ADDRESS = 'kQDgnzDlOGWHoH_xDua9yXRemnChK2ox2HaQhIIlt8J1s18g';

export async function run(provider: NetworkProvider) {
    const massSenderAddress = Address.parse(MASS_SENDER_ADDRESS);
    const massSender = provider.open(JettonDistributor.createFromAddress(massSenderAddress));

    console.log(`Initiating sending process for MassSender at ${MASS_SENDER_ADDRESS}`);
    
    // Отправляем достаточно TON для оплаты комиссий за обработку сообщений
    await massSender.sendProcessMessages(provider.sender(), toNano('3'));
    console.log('Process messages initiated.');
}