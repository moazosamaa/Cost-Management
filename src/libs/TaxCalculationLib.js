import Decimal from 'decimal.js';

export class TaxCalculationLib {
  constructor() {
    // Default tax rates by region
    this.taxRates = {
      'US': {
        'default': 0.0,
        'CA': 0.0725, // California
        'NY': 0.04,   // New York
        'TX': 0.0625  // Texas
      },
      'EU': {
        'default': 0.20,  // Standard VAT rate
        'DE': 0.19,       // Germany
        'FR': 0.20,       // France
        'IT': 0.22        // Italy
      },
      'ASIA': {
        'default': 0.10,
        'JP': 0.10,       // Japan
        'SG': 0.07,       // Singapore
        'IN': 0.18        // India
      }
    };
  }

  /**
   * Calculate tax amount based on subtotal and region or tax rate
   * @param {number} subtotal - The subtotal amount before tax
   * @param {string|number} regionOrRate - The region code (e.g., 'US-CA') or direct tax rate (e.g., 0.1)
   * @returns {object} - Tax calculation result
   */
  calculateTax(subtotal, regionOrRate) {
    let taxRate;

    // If regionOrRate is a number, use it directly as the tax rate
    if (typeof regionOrRate === 'number') {
      taxRate = regionOrRate;
    } else {
      // Otherwise, treat it as a region code
      const [mainRegion, subRegion] = regionOrRate.split('-');
      
      if (!this.taxRates[mainRegion]) {
        throw new Error(`Invalid region: ${mainRegion}`);
      }

      taxRate = subRegion 
        ? this.taxRates[mainRegion][subRegion] || this.taxRates[mainRegion].default
        : this.taxRates[mainRegion].default;
    }

    const taxAmount = new Decimal(subtotal).times(taxRate).toNumber();
    const total = new Decimal(subtotal).plus(taxAmount).toNumber();

    return {
      subtotal,
      taxRate,
      taxAmount,
      total,
      region: typeof regionOrRate === 'string' ? regionOrRate : 'CUSTOM',
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Get available tax rates for a region
   * @param {string} region - The region code
   * @returns {object} - Tax rates for the region
   */
  getTaxRates(region) {
    if (!this.taxRates[region]) {
      throw new Error(`Invalid region: ${region}`);
    }
    return this.taxRates[region];
  }

  /**
   * Add or update a tax rate for a region
   * @param {string} region - The region code (e.g., 'US-CA')
   * @param {number} rate - The tax rate (e.g., 0.0725 for 7.25%)
   */
  updateTaxRate(region, rate) {
    const [mainRegion, subRegion] = region.split('-');
    
    if (!this.taxRates[mainRegion]) {
      this.taxRates[mainRegion] = { default: rate };
    } else if (subRegion) {
      this.taxRates[mainRegion][subRegion] = rate;
    } else {
      this.taxRates[mainRegion].default = rate;
    }
  }

  /**
   * Calculate tax breakdown for multiple items
   * @param {Array} items - Array of items with quantity and unit price
   * @param {string|number} regionOrRate - The region code or direct tax rate
   * @returns {object} - Detailed tax breakdown
   */
  calculateDetailedTax(items, regionOrRate) {
    const itemizedTax = items.map(item => {
      const subtotal = new Decimal(item.quantity).times(item.unitPrice).toNumber();
      const tax = this.calculateTax(subtotal, regionOrRate);
      return {
        ...item,
        ...tax
      };
    });

    const totals = itemizedTax.reduce((acc, item) => ({
      subtotal: new Decimal(acc.subtotal).plus(item.subtotal).toNumber(),
      taxAmount: new Decimal(acc.taxAmount).plus(item.taxAmount).toNumber(),
      total: new Decimal(acc.total).plus(item.total).toNumber()
    }), { subtotal: 0, taxAmount: 0, total: 0 });

    return {
      items: itemizedTax,
      totals,
      region: typeof regionOrRate === 'string' ? regionOrRate : 'CUSTOM',
      calculatedAt: new Date().toISOString()
    };
  }
}

export default TaxCalculationLib; 