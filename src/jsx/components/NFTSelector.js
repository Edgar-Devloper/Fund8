import React, { useMemo, memo, useCallback } from 'react';
import { useNFT } from '../../context/NFTContext';
import { useTranslation } from 'react-i18next';
import { useNFTList } from '../../hooks/useNFTList';
import NFTCard from './nft/NFTCard';
import EmptyNFTState from './nft/EmptyNFTState';
import NFTPagination from './nft/NFTPagination';
import SelectedNFTInfo from './nft/SelectedNFTInfo';

const NFTSelector = memo(({ onSelect, showOnlyFund8 = false, showOnlyDefily = false }) => {
  const { t } = useTranslation();
  const {
    nfts,
    selectedNFT,
    isLoading,
    error,
    selectNFT,
    deselectNFT,
    defilyNFTs,
    fund8NFTs,
    hasNFTs
  } = useNFT();

  const itemsPerPage = 6;

  const filteredNFTs = useMemo(() => {
    if (showOnlyFund8) {
      return fund8NFTs;
    } else if (showOnlyDefily) {
      return defilyNFTs;
    }
    return nfts;
  }, [showOnlyFund8, showOnlyDefily, nfts, defilyNFTs, fund8NFTs]);

  const {
    currentPage,
    totalPages,
    currentNFTs,
    goToPage
  } = useNFTList(filteredNFTs, itemsPerPage);

  const handleSelectNFT = useCallback((nft) => {
    if (selectedNFT && selectedNFT.id === nft.id) {
      deselectNFT();
      if (onSelect) {
        onSelect(null);
      }
    } else {
      selectNFT(nft);
      if (onSelect) {
        onSelect(nft);
      }
    }
  }, [selectedNFT, deselectNFT, selectNFT, onSelect]);

  if (isLoading) {
    return (
      <div className="nft-selector-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">{t('nft.loading_nfts')}</span>
        </div>
        <p className="mt-2">{t('nft.loading_nfts')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nft-selector-error alert alert-danger">
        <strong>{t('nft.error_loading')}</strong> {error}
        <button 
          className="btn btn-sm btn-outline-danger mt-2" 
          onClick={() => window.location.reload()}
        >
          {t('nft.retry')}
        </button>
      </div>
    );
  }

  if (!hasNFTs) {
    return <EmptyNFTState />;
  }

  if (filteredNFTs.length === 0) {
    return (
      <div className="nft-selector-empty">
        <p className="text-muted">
          {t('nft.no_nfts_type')}
        </p>
      </div>
    );
  }

  return (
    <div className="nft-selector">
      <div className="nft-list">
        <div className="row">
          {currentNFTs.map((nft) => (
            <NFTCard 
              key={nft.id} 
              nft={nft} 
              isSelected={selectedNFT && selectedNFT.id === nft.id}
              onSelect={() => handleSelectNFT(nft)}
              onDeselect={deselectNFT}
              t={t}
            />
          ))}
        </div>
      </div>

      <NFTPagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      {selectedNFT && (
        <SelectedNFTInfo selectedNFT={selectedNFT} />
      )}
    </div>
  );
});

NFTSelector.displayName = 'NFTSelector';

export default NFTSelector;
export { getImageUrl } from '../../utils/nftUtils';
