import { Contract, JsonRpcProvider, getAddress } from "ethers";

const ERC721_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export async function isRecruiterPassHolder(address: string): Promise<boolean> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  const contractAddress = process.env.NEXT_PUBLIC_RECRUITER_PASS_CONTRACT_ADDRESS;

  if (!rpcUrl || !chainId || !contractAddress || !address) {
    return false;
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl, Number(chainId));
    const contract = new Contract(getAddress(contractAddress), ERC721_ABI, provider);
    const balance = (await contract.balanceOf(getAddress(address))) as bigint;
    return balance > 0n;
  } catch {
    return false;
  }
}
