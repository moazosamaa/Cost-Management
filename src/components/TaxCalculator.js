import React, { useState, useEffect } from 'react';
import { TaxCalculationLib } from '../libs/TaxCalculationLib';
import './TaxCalculator.css';

const TaxCalculator = () => {
  const [subtotal, setSubtotal] = useState('');
  const [region, setRegion] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [result, setResult] = useState(null);
  const [availableRegions, setAvailableRegions] = useState({});
  const [selectedSubRegion, setSelectedSubRegion] = useState('');
  const [subRegions, setSubRegions] = useState({});

  const taxLib = new TaxCalculationLib();

  useEffect(() => {
    // Get all available regions from the tax library
    const regions = {};
    Object.keys(taxLib.taxRates).forEach(region => {
      regions[region] = taxLib.getTaxRates(region);
    });
    setAvailableRegions(regions);
  }, []);

  useEffect(() => {
    if (region && availableRegions[region]) {
      const subRegionRates = { ...availableRegions[region] };
      delete subRegionRates.default;
      setSubRegions(subRegionRates);
      setSelectedSubRegion('');
    } else {
      setSubRegions({});
      setSelectedSubRegion('');
    }
  }, [region, availableRegions]);

  const handleCalculate = (e) => {
    e.preventDefault();
    
    try {
      const subtotalValue = parseFloat(subtotal);
      if (isNaN(subtotalValue)) {
        throw new Error('Please enter a valid subtotal amount');
      }

      let taxResult;
      if (useCustomRate) {
        const rate = parseFloat(customRate);
        if (isNaN(rate) || rate < 0 || rate > 1) {
          throw new Error('Please enter a valid tax rate between 0 and 1');
        }
        taxResult = taxLib.calculateTax(subtotalValue, rate);
      } else {
        const regionCode = selectedSubRegion ? `${region}-${selectedSubRegion}` : region;
        taxResult = taxLib.calculateTax(subtotalValue, regionCode);
      }

      setResult(taxResult);
    } catch (error) {
      alert(error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (rate) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rate);
  };

  return (
    <div className="tax-calculator">
      <h2>Tax Calculator</h2>
      
      <form onSubmit={handleCalculate} className="calculator-form">
        <div className="form-group">
          <label htmlFor="subtotal">Subtotal Amount:</label>
          <input
            type="number"
            id="subtotal"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
            min="0"
            step="0.01"
            required
            className="form-control"
            placeholder="Enter amount"
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={useCustomRate}
              onChange={(e) => setUseCustomRate(e.target.checked)}
            />
            Use Custom Tax Rate
          </label>
        </div>

        {useCustomRate ? (
          <div className="form-group">
            <label htmlFor="customRate">Custom Tax Rate:</label>
            <input
              type="number"
              id="customRate"
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              min="0"
              max="1"
              step="0.0001"
              required={useCustomRate}
              className="form-control"
              placeholder="Enter rate (e.g., 0.1 for 10%)"
            />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="region">Region:</label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required={!useCustomRate}
                className="form-control"
              >
                <option value="">Select Region</option>
                {Object.keys(availableRegions).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {region && Object.keys(subRegions).length > 0 && (
              <div className="form-group">
                <label htmlFor="subRegion">Sub-Region:</label>
                <select
                  id="subRegion"
                  value={selectedSubRegion}
                  onChange={(e) => setSelectedSubRegion(e.target.value)}
                  className="form-control"
                >
                  <option value="">Default Rate</option>
                  {Object.keys(subRegions).map(sr => (
                    <option key={sr} value={sr}>{sr}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <button type="submit" className="btn-primary">
          Calculate Tax
        </button>
      </form>

      {result && (
        <div className="calculation-result">
          <h3>Tax Calculation Result</h3>
          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>{formatCurrency(result.subtotal)}</td>
              </tr>
              <tr>
                <td>Tax Rate:</td>
                <td>{formatPercent(result.taxRate)}</td>
              </tr>
              <tr>
                <td>Tax Amount:</td>
                <td>{formatCurrency(result.taxAmount)}</td>
              </tr>
              <tr>
                <td>Total:</td>
                <td>{formatCurrency(result.total)}</td>
              </tr>
              <tr>
                <td>Region:</td>
                <td>{result.region}</td>
              </tr>
              <tr>
                <td>Calculated At:</td>
                <td>{new Date(result.calculatedAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator; 