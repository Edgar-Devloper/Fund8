export const getNftMetadata = async (ipfsLink) => {
  if (!ipfsLink || !ipfsLink.includes('.json')) {
    return null;
  }

  try {
    const ipfsCid = ipfsLink.split('//')[1];
    const metadataUrl = `https://ipfs.io/ipfs/${ipfsCid}`;
    
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }
    
    const metadata = await response.json();
    
    if (metadata.image) {
      metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return metadata;
  } catch (error) {
    console.error('[NFT Metadata] Error fetching metadata:', error);
    return null;
  }
};

export const getImageUrl = (ipfsLink, tokenId = null, metadata = null) => {
  if (!ipfsLink || !ipfsLink.trim() === '') {
    return null;
  }
  
  if (metadata && metadata.image) {
    return metadata.image;
  }
  
  let cleanLink = ipfsLink.trim();
  
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    return cleanLink;
  }
  
  if (cleanLink.startsWith('ipfs://')) {
    let cid = cleanLink.replace('ipfs://', '').trim();
    
    if (cleanLink.includes('.json')) {
      const parts = cid.split('/');
      cid = parts[0];
      if (tokenId) {
        return `https://ipfs.io/ipfs/${cid}/${tokenId}.png`;
      }
      return `https://ipfs.io/ipfs/${cid}`;
    }
    
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  if (cleanLink.match(/^[a-zA-Z0-9]{46,59}$/) || cleanLink.startsWith('Qm') || cleanLink.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${cleanLink}${tokenId ? `/${tokenId}.png` : ''}`;
  }
  
  return `https://ipfs.io/ipfs/${cleanLink}`;
};

export const extractOwnerId = (referralsLink) => {
  if (!referralsLink) {
    return null;
  }
  
  if (!isNaN(Number(referralsLink)) && referralsLink.trim() !== '') {
    return Number(referralsLink);
  }
  
  const numericMatch = referralsLink.match(/\d+/);
  if (numericMatch && numericMatch[0].length >= 2) {
    return Number(numericMatch[0]);
  }
  
  return null;
};



