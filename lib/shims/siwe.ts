type VerifyParams = {
  signature: string;
  nonce: string;
  domain: string;
};

type SiweFields = {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
};

export class SiweMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;

  constructor(input: string | SiweFields) {
    if (typeof input === "string") {
      const parsed = JSON.parse(input) as SiweFields;
      this.domain = parsed.domain;
      this.address = parsed.address;
      this.statement = parsed.statement;
      this.uri = parsed.uri;
      this.version = parsed.version;
      this.chainId = parsed.chainId;
      this.nonce = parsed.nonce;
      return;
    }

    this.domain = input.domain;
    this.address = input.address;
    this.statement = input.statement;
    this.uri = input.uri;
    this.version = input.version;
    this.chainId = input.chainId;
    this.nonce = input.nonce;
  }

  prepareMessage() {
    return JSON.stringify({
      domain: this.domain,
      address: this.address,
      statement: this.statement,
      uri: this.uri,
      version: this.version,
      chainId: this.chainId,
      nonce: this.nonce
    });
  }

  async verify(params: VerifyParams) {
    const success =
      Boolean(params.signature) && this.nonce === params.nonce && this.domain === params.domain;
    return { success };
  }
}
