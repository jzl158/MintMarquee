/**
 * ShippingCalculator Component
 * Calculates shipping costs based on location and product details
 * Displays shipping options and estimated delivery times
 */

import { Component } from 'react';
import type { ShippingInfo } from '../types/product';

interface ShippingCalculatorProps {
  shippingInfo: ShippingInfo;
  productPrice: number;
  productName: string;
}

interface ShippingCalculatorState {
  zipCode: string;
  country: string;
  selectedMethod: ShippingMethod;
  calculating: boolean;
  shippingOptions: ShippingOption[];
  error: string | null;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

interface ShippingOption extends ShippingMethod {
  carrier: string;
  description: string;
}

export default class ShippingCalculator extends Component<ShippingCalculatorProps, ShippingCalculatorState> {
  constructor(props: ShippingCalculatorProps) {
    super(props);

    // Default shipping options based on product shipping info
    const defaultOptions: ShippingOption[] = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        carrier: 'USPS',
        price: props.shippingInfo.shippingCost || 5.99,
        estimatedDays: props.shippingInfo.estimatedDays || '5-7 business days',
        description: 'Affordable standard delivery',
      },
      {
        id: 'priority',
        name: 'Priority Shipping',
        carrier: 'USPS Priority',
        price: (props.shippingInfo.shippingCost || 5.99) * 1.5,
        estimatedDays: '2-3 business days',
        description: 'Faster delivery with tracking',
      },
      {
        id: 'express',
        name: 'Express Shipping',
        carrier: 'FedEx',
        price: (props.shippingInfo.shippingCost || 5.99) * 2.5,
        estimatedDays: '1-2 business days',
        description: 'Expedited overnight delivery',
      },
    ];

    this.state = {
      zipCode: '',
      country: 'US',
      selectedMethod: defaultOptions[0],
      calculating: false,
      shippingOptions: defaultOptions,
      error: null,
    };

    this.handleZipCodeChange = this.handleZipCodeChange.bind(this);
    this.handleCountryChange = this.handleCountryChange.bind(this);
    this.calculateShipping = this.calculateShipping.bind(this);
    this.selectShippingMethod = this.selectShippingMethod.bind(this);
  }

  handleZipCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ zipCode: e.target.value, error: null });
  }

  handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({ country: e.target.value, error: null });
  }

  async calculateShipping() {
    const { zipCode, country } = this.state;

    if (!zipCode && country === 'US') {
      this.setState({ error: 'Please enter a ZIP code' });
      return;
    }

    this.setState({ calculating: true, error: null });

    try {
      // Simulate API call to shipping provider
      // In production, this would call your backend which integrates with
      // shipping APIs like USPS, UPS, FedEx, or Shippo

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate shipping based on weight, dimensions, and destination
      const { shippingInfo, productPrice } = this.props;
      const baseRate = shippingInfo.shippingCost || 5.99;

      // Adjust rates based on country
      const internationalMultiplier = country === 'US' ? 1 : 2.5;

      const calculatedOptions: ShippingOption[] = [
        {
          id: 'standard',
          name: country === 'US' ? 'Standard Shipping' : 'International Standard',
          carrier: country === 'US' ? 'USPS' : 'USPS International',
          price: baseRate * internationalMultiplier,
          estimatedDays: country === 'US' ? '5-7 business days' : '10-15 business days',
          description: 'Affordable standard delivery',
        },
        {
          id: 'priority',
          name: country === 'US' ? 'Priority Shipping' : 'International Priority',
          carrier: country === 'US' ? 'USPS Priority' : 'DHL Express',
          price: baseRate * 1.5 * internationalMultiplier,
          estimatedDays: country === 'US' ? '2-3 business days' : '5-7 business days',
          description: 'Faster delivery with tracking',
        },
      ];

      if (country === 'US') {
        calculatedOptions.push({
          id: 'express',
          name: 'Express Shipping',
          carrier: 'FedEx',
          price: baseRate * 2.5,
          estimatedDays: '1-2 business days',
          description: 'Expedited overnight delivery',
        });
      }

      // Free shipping for orders over certain amount
      if (productPrice > 50) {
        calculatedOptions[0].price = 0;
        calculatedOptions[0].description = 'FREE shipping on orders over $50!';
      }

      this.setState({
        shippingOptions: calculatedOptions,
        selectedMethod: calculatedOptions[0],
        calculating: false,
      });

    } catch (error) {
      console.error('Shipping calculation failed:', error);
      this.setState({
        error: 'Unable to calculate shipping. Please try again.',
        calculating: false,
      });
    }
  }

  selectShippingMethod(method: ShippingOption) {
    this.setState({ selectedMethod: method });
  }

  componentDidMount() {
    // Auto-calculate with default values
    this.calculateShipping();
  }

  render() {
    const { shippingInfo, productPrice } = this.props;
    const { zipCode, country, selectedMethod, calculating, shippingOptions, error } = this.state;

    if (!shippingInfo || !shippingInfo.enabled) {
      return (
        <div className="shipping-unavailable pa3 bg-light-gray br2">
          <i className="material-icons f5 v-mid mr2">local_shipping</i>
          <span>Shipping information not available for this product</span>
        </div>
      );
    }

    return (
      <div className="shipping-calculator">
        <h3 className="f5 fw6 mb3">
          <i className="material-icons f5 v-mid mr2">local_shipping</i>
          Shipping Options
        </h3>

        {/* Product Shipping Details */}
        {shippingInfo.weight && shippingInfo.dimensions && (
          <div className="product-details mb3 pa2 bg-near-white br2 f7 gray">
            <div>Weight: {shippingInfo.weight}g</div>
            <div>
              Dimensions: {shippingInfo.dimensions.length}×{shippingInfo.dimensions.width}×
              {shippingInfo.dimensions.height}mm
            </div>
          </div>
        )}

        {/* Shipping Calculator Form */}
        <div className="calculator-form mb3">
          <div className="flex gap-2">
            <div className="flex-grow-1">
              <label className="db f6 fw6 mb2">Country</label>
              <select
                value={country}
                onChange={this.handleCountryChange}
                className="w-100 pa2 br2 ba b--light-gray"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {country === 'US' && (
              <div className="flex-grow-1">
                <label className="db f6 fw6 mb2">ZIP Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={this.handleZipCodeChange}
                  placeholder="12345"
                  className="w-100 pa2 br2 ba b--light-gray"
                  maxLength={10}
                />
              </div>
            )}

            <div className="flex items-end">
              <button
                onClick={this.calculateShipping}
                disabled={calculating}
                className="calculate-btn pa2 br2 bn white pointer"
              >
                {calculating ? 'Calculating...' : 'Calculate'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message mt2 f6 red">
              <i className="material-icons f7 v-mid mr1">error</i>
              {error}
            </div>
          )}
        </div>

        {/* Shipping Options */}
        {!calculating && shippingOptions.length > 0 && (
          <div className="shipping-options">
            {shippingOptions.map(option => (
              <div
                key={option.id}
                onClick={() => this.selectShippingMethod(option)}
                className={`shipping-option pa3 mb2 br2 ba pointer ${
                  selectedMethod.id === option.id ? 'selected' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedMethod.id === option.id}
                      onChange={() => this.selectShippingMethod(option)}
                      className="mr3"
                    />
                    <div>
                      <div className="fw6 mb1">{option.name}</div>
                      <div className="f6 gray mb1">{option.carrier}</div>
                      <div className="f7 gray">{option.description}</div>
                    </div>
                  </div>
                  <div className="tr">
                    <div className="fw6 f5">
                      {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
                    </div>
                    <div className="f7 gray mt1">{option.estimatedDays}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Free Shipping Banner */}
        {productPrice > 0 && productPrice < 50 && country === 'US' && (
          <div className="free-shipping-banner mt3 pa2 bg-light-yellow dark-gray br2 f7 tc">
            <i className="material-icons f6 v-mid mr2">info</i>
            Add ${(50 - productPrice).toFixed(2)} more to qualify for FREE shipping!
          </div>
        )}

        <style jsx>{`
          .shipping-calculator {
            width: 100%;
            margin: 1rem 0;
          }

          .calculate-btn {
            background: #2196F3;
            transition: background 0.2s ease;
            min-width: 100px;
          }

          .calculate-btn:hover:not(:disabled) {
            background: #1976D2;
          }

          .calculate-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .shipping-option {
            border-color: #ddd;
            transition: all 0.2s ease;
            background: white;
          }

          .shipping-option:hover {
            border-color: #2196F3;
            background: #f5f5f5;
          }

          .shipping-option.selected {
            border-color: #2196F3;
            border-width: 2px;
            background: #e3f2fd;
          }

          .gap-2 > * + * {
            margin-left: 0.5rem;
          }

          .shipping-unavailable {
            display: flex;
            align-items: center;
          }
        `}</style>
      </div>
    );
  }
}
