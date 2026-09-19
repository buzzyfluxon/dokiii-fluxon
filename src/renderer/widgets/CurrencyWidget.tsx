import React, { useState, useEffect } from 'react';

export const CurrencyWidget: React.FC = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const fetchPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setPrice(data.bitcoin.usd);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedPrice = price 
    ? new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
    : '--';

  return (
    <div className="currency-widget" title="Bitcoin Price (USD)">
      <div className="currency-pair">
        <span className="currency-from">USD</span>
        <span className="currency-arrow-icon">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 13 12 18 17 13" />
            <line x1="12" y1="6" x2="12" y2="18" />
          </svg>
        </span>
        <span className="currency-to">BTC</span>
      </div>
      <div className="currency-value">{error ? (price ? `$${formattedPrice}` : 'Offline') : `$${formattedPrice}`}</div>
    </div>
  );
};

export default CurrencyWidget;
