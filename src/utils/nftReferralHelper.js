/**
 * Helper para convertir nftId a referralLink (hash) necesario para crear NFTs
 */
import { getReferralLinkFromTokenId } from '../features/smart-contracts/services/nft.service';

/**
 * Convierte nftId de URL a referralLink (hash) para usar en la compra de NFT
 * @param {number|null} nftId - ID del NFT sponsor
 * @returns {Promise<string|null>} referralLink (hash) o null si no se encuentra
 */
export const convertNftIdToReferralLink = async (nftId) => {
  if (!nftId && nftId !== 0) {
    return null;
  }

  try {
    const referralLink = await getReferralLinkFromTokenId(nftId);
    return referralLink;
  } catch (error) {
    console.error('[convertNftIdToReferralLink] Error:', error);
    throw error;
  }
};

/**
 * Normaliza un referralLink al formato esperado (hex-64 sin 0x)
 * Similar a la función en DeFily
 * @param {string|null|undefined} raw - referralLink crudo
 * @returns {string} referralLink normalizado
 */
export const normalizeReferralLink = (raw) => {
  const value = (raw || "").trim();
  if (!value) return "";
  const without0x = value.startsWith("0x") ? value.slice(2) : value;
  // Si ya es un hash de 64 caracteres, retornarlo
  if (/^[0-9a-fA-F]{64}$/.test(without0x)) {
    return without0x.toLowerCase();
  }
  // Si no, intentar hashearlo (aunque normalmente debería venir como hash del contrato)
  return without0x.toLowerCase();
};


