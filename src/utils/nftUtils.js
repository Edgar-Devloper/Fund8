import { addCacheBust } from './cacheVersion';

export const getNftMetadata = async (ipfsLink) => {
  if (!ipfsLink || !ipfsLink.includes('.json')) {
    return null;
  }

  try {
    const ipfsCid = ipfsLink.split('//')[1];
    // Agregar cache bust al fetch de metadata
    const metadataUrl = addCacheBust(`https://ipfs.io/ipfs/${ipfsCid}`);
    
    const response = await fetch(metadataUrl, {
      cache: 'no-cache' // Forzar no usar caché para metadata
    });
    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }
    
    const metadata = await response.json();
    
    if (metadata.image) {
      let imageUrl = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      // Agregar cache bust a la URL de la imagen
      metadata.image = addCacheBust(imageUrl);
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
    // Agregar cache bust a la imagen del metadata
    return addCacheBust(metadata.image);
  }
  
  let cleanLink = ipfsLink.trim();
  
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    // Agregar cache bust a URLs existentes
    return addCacheBust(cleanLink);
  }
  
  let finalUrl = '';
  
  if (cleanLink.startsWith('ipfs://')) {
    let cid = cleanLink.replace('ipfs://', '').trim();
    
    if (cleanLink.includes('.json')) {
      const parts = cid.split('/');
      cid = parts[0];
      if (tokenId) {
        finalUrl = `https://ipfs.io/ipfs/${cid}/${tokenId}.png`;
      } else {
        finalUrl = `https://ipfs.io/ipfs/${cid}`;
      }
    } else {
      finalUrl = `https://ipfs.io/ipfs/${cid}`;
    }
  } else if (cleanLink.match(/^[a-zA-Z0-9]{46,59}$/) || cleanLink.startsWith('Qm') || cleanLink.startsWith('bafy')) {
    finalUrl = `https://ipfs.io/ipfs/${cleanLink}${tokenId ? `/${tokenId}.png` : ''}`;
  } else {
    finalUrl = `https://ipfs.io/ipfs/${cleanLink}`;
  }
  
  // Agregar cache bust a todas las URLs de IPFS
  return addCacheBust(finalUrl);
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












