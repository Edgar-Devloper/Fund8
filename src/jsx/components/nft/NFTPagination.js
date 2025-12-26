import React from 'react';

const NFTPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className="d-flex justify-content-center mt-3"
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '4px 8px'
        }}
      >
        {Array.from({ length: totalPages }).map((_, index) => {
          const page = index + 1;
          const isActive = page === currentPage;
          return (
            <button
              key={`dot-page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              style={{
                width: isActive ? '12px' : '8px',
                height: isActive ? '12px' : '8px',
                borderRadius: '999px',
                border: 'none',
                background: isActive ? '#00e5cc' : '#2d3748',
                opacity: isActive ? 1 : 0.6,
                transition: 'all 0.2s ease',
                padding: 0
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NFTPagination;













