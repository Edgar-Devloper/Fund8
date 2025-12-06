// Base URL for referral links
// If REACT_APP_REFERRAL_DISPLAY_URL is set, use it for display (assumes proxy is configured)
// Otherwise, use defily.ai directly for functionality
const DEFILY_BACKEND_URL = 'https://app.defily.ai';
const DEFILY_DISPLAY_URL = process.env.REACT_APP_REFERRAL_DISPLAY_URL || DEFILY_BACKEND_URL;
const DEFILY_URL = DEFILY_DISPLAY_URL; // Use display URL (should have proxy configured)

const extractReferralCode = (referralsLink) => {
  if (!referralsLink) {
    return null;
  }

  const trimmed = referralsLink.trim();
  
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const refParam = url.searchParams.get('ref');
    if (refParam) {
      return refParam;
    }
  } catch {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const match = trimmed.match(/[?&]ref=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  if (trimmed.length > 200) {
    return null;
  }

  return trimmed;
};

export const generateReferralLink = (referralsLink, side, tokenId = null) => {
  const sideValue = side === 'left' ? '0' : '1';
  const baseUrl = DEFILY_URL;
  
  let refCode = extractReferralCode(referralsLink);
  
  if (!refCode && tokenId !== null) {
    refCode = tokenId.toString();
  }
  
  if (!refCode) {
    return null;
  }
  
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('ref', refCode);
    url.searchParams.set('side', sideValue);
    return url.toString();
  } catch {
    return `${baseUrl}?ref=${encodeURIComponent(refCode)}&side=${sideValue}`;
  }
};

export const getDefilyBuyUrl = (referralTokenId = 0, side = 0) => {
  return `${DEFILY_URL}?ref=${referralTokenId}&side=${side}`;
};

// Default referral link for Fund8 users without referral link
// Points to Fund8 genesis account (NFT #2904) in DeFily tree
export const getFund8DefaultReferralUrl = () => {
  return `${DEFILY_URL}?nftId=2904&side=A`;
};

export const openReferralLink = (referralsLink, side, tokenId = null) => {
  const link = generateReferralLink(referralsLink, side, tokenId);
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
};

export { DEFILY_URL };

