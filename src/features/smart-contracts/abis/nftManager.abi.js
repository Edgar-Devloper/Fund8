/**
 * ABI del contrato NFT Manager (mismo que usa DeFily)
 * Solo incluye las funciones necesarias para comprar NFT
 */
export const nftManagerAbi = [
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint96", name: "nftImgId", type: "uint96" },
          { internalType: "uint16", name: "NFT_COLLECTION_ID", type: "uint16" },
          { internalType: "string", name: "referralLink", type: "string" },
          { internalType: "uint8", name: "side", type: "uint8" },
        ],
        internalType: "struct INFTData.BuyNFT",
        name: "_data",
        type: "tuple",
      },
      { internalType: "string", name: "_CID", type: "string" },
      { internalType: "bool", name: "_royalty", type: "bool" },
    ],
    name: "buyNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllNFTCollections",
    outputs: [
      {
        components: [
          { internalType: "string", name: "baseURI", type: "string" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "tokensCount", type: "uint256" },
          { internalType: "uint256", name: "tokensLimit", type: "uint256" },
        ],
        internalType: "struct INFTData.NftCollection[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
