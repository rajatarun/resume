declare module "siwe" {
  export type SiweMessageParams = {
    domain: string;
    address: string;
    statement?: string;
    uri: string;
    version: string;
    chainId: number;
    nonce: string;
    issuedAt?: string;
  };

  export class SiweMessage {
    domain: string;
    address: string;
    statement?: string;
    uri: string;
    version: string;
    chainId: number;
    nonce: string;
    issuedAt?: string;

    constructor(input: string | SiweMessageParams);
    prepareMessage(): string;
  }
}
