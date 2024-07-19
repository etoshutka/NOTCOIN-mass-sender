import { Address, toNano } from 'ton-core';
import { MassSender } from '../wrappers/MassSender';
import { NetworkProvider } from '@ton-community/blueprint';

// Адрес развернутого контракта MassSender
const MASS_SENDER_ADDRESS = 'kQAteBH5Skmfr8lk4Gt1-0g3Aax3AwGdCgHo__XeN7_pWFEu';

export async function run(provider: NetworkProvider) {
    const massSenderAddress = Address.parse(MASS_SENDER_ADDRESS);
    const massSender = provider.open(MassSender.createFromAddress(massSenderAddress));

    console.log(`Initiating sending process for MassSender at ${MASS_SENDER_ADDRESS}`);

    // Отправляем достаточно TON для оплаты комиссий за отправку jetton-токенов
    await massSender.sendStartSending(provider.sender(), toNano('0.5'));
    console.log('Start sending initiated.');
}