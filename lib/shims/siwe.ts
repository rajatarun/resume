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

const PREFIX = " wants you to sign in with your Ethereum account:";

function normalize(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function parsePreparedMessage(input: string): SiweMessageParams {
  const lines = normalize(input).split("\n");
  if (lines.length < 6) {
    throw new Error("Invalid SIWE message format");
  }

  const firstLine = lines[0] ?? "";
  const markerIndex = firstLine.indexOf(PREFIX);
  if (markerIndex <= 0) {
    throw new Error("Invalid SIWE message format");
  }

  const domain = firstLine.slice(0, markerIndex).trim();
  const address = (lines[1] ?? "").trim();
  if (!domain || !address) {
    throw new Error("Invalid SIWE message format");
  }

  let cursor = 3;
  let statement: string | undefined;

  if (lines[cursor] && !lines[cursor].startsWith("URI:")) {
    statement = lines[cursor].trim();
    cursor += 1;
  }

  const kv: Record<string, string> = {};
  for (; cursor < lines.length; cursor += 1) {
    const line = lines[cursor]?.trim();
    if (!line) continue;
    const split = line.indexOf(":");
    if (split <= 0) continue;
    kv[line.slice(0, split)] = line.slice(split + 1).trim();
  }

  const chainIdRaw = kv["Chain ID"];
  const chainId = chainIdRaw ? Number(chainIdRaw) : Number.NaN;

  if (!kv.URI || !kv.Version || !kv.Nonce || !Number.isFinite(chainId)) {
    throw new Error("Invalid SIWE message format");
  }

  return {
    domain,
    address,
    statement,
    uri: kv.URI,
    version: kv.Version,
    chainId,
    nonce: kv.Nonce,
    issuedAt: kv["Issued At"]
  };
}

export class SiweMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt?: string;

  constructor(input: string | SiweMessageParams) {
    const parsed = typeof input === "string" ? parsePreparedMessage(input) : input;

    this.domain = parsed.domain;
    this.address = parsed.address;
    this.statement = parsed.statement;
    this.uri = parsed.uri;
    this.version = parsed.version;
    this.chainId = parsed.chainId;
    this.nonce = parsed.nonce;
    this.issuedAt = parsed.issuedAt;
  }

  prepareMessage(): string {
    const lines = [
      `${this.domain}${PREFIX}`,
      this.address,
      ""
    ];

    if (this.statement) {
      lines.push(this.statement, "");
    }

    lines.push(
      `URI: ${this.uri}`,
      `Version: ${this.version}`,
      `Chain ID: ${this.chainId}`,
      `Nonce: ${this.nonce}`
    );

    if (this.issuedAt) {
      lines.push(`Issued At: ${this.issuedAt}`);
    }

    return lines.join("\n");
  }
}
