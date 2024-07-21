import { Address } from '@ton/core';
import fs from 'fs';
import crypto from 'crypto';

function generateRandomTestnetAddress(): string {
  const buffer = crypto.randomBytes(32);
  const address = new Address(0, buffer);
  return address.toString({urlSafe: true, bounceable: true, testOnly: true});
}

function generateAddresses(count: number): Record<string, number> {
  const addresses: Record<string, number> = {};
  while (Object.keys(addresses).length < count) {
    const address = generateRandomTestnetAddress();
    if (!(address in addresses)) {
      addresses[address] = 10000000;
    }
  }
  return addresses;
}

function saveToJson(data: Record<string, number>, filename: string): void {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}


const addresses = generateAddresses(100);


saveToJson(addresses, 'ton_testnet_addresses.json');

