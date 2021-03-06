import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../../../lib/utils';
import withIntl from '../../../lib/withIntl';
import { get } from 'lodash';

import RefundTransactionBtn from './RefundTransactionBtn';


class TransactionDetails extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    transaction: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
    mode: PropTypes.string, // open or closed
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'hostFeeInHostCurrency': { id: 'transaction.hostFeeInHostCurrency', defaultMessage: '{hostFeePercent} host fee' },
      'platformFeeInHostCurrency': { id: 'transaction.platformFeeInHostCurrency', defaultMessage: '5% Open Collective fee' },
      'paymentProcessorFeeInHostCurrency': { id: 'transaction.paymentProcessorFeeInHostCurrency', defaultMessage: 'payment processor fee' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};
  }

  render() {
    const { intl, collective, LoggedInUser, transaction } = this.props;
    const type = transaction.type.toLowerCase();
    const hostFeePercent = `${transaction.host.hostFeePercent}%`;
    const amountDetails = [intl.formatNumber(transaction.amount / 100, { currency: transaction.currency, ...this.currencyStyle })];
    if (transaction.hostCurrencyFxRate && transaction.hostCurrencyFxRate !== 1) {
      const amountInHostCurrency = transaction.amount * transaction.hostCurrencyFxRate;
      amountDetails.push(` (${intl.formatNumber(amountInHostCurrency / 100, { currency: transaction.hostCurrency, ...this.currencyStyle })})`);
    }
    const addFees = (feesArray) => {
      feesArray.forEach(feeName => {
        if (transaction[feeName]) {
          amountDetails.push(`${intl.formatNumber(transaction[feeName] / 100, { currency: transaction.hostCurrency, ...this.currencyStyle })} (${intl.formatMessage(this.messages[feeName], { hostFeePercent })})`);
        }
      })
    }

    addFees(['hostFeeInHostCurrency', 'platformFeeInHostCurrency', 'paymentProcessorFeeInHostCurrency']);

    const amountDetailsStr = amountDetails.length > 1 ? amountDetails.join(' ') : null;

    return (
      <div className={`TransactionDetails ${this.props.mode}`}>
        <style jsx>{`
          .TransactionDetails {
            font-size: 1.2rem;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            max-height: 19rem;
          }
          .TransactionDetails.closed {
            max-height: 0;
          }
          .TransactionDetails .frame {
            padding: 4px;
            margin-top: 1rem;
            margin-right: 1rem;
            float: left;
            background-color: #f3f4f5;
          }
          .TransactionDetails img {
            width: 64px;
          }
          .col {
            float: left;
            display: flex;
            flex-direction: column;
            margin-right: 1rem;
            margin-top: 1rem;
          }
          label {
            text-transform: uppercase;
            color: #aaaeb3;
            font-weight: 300;
            font-family: lato, montserratlight, arial;
            white-space: nowrap;
          }
          .netAmountInCollectiveCurrency {
            font-weight: bold;
          }
          .TransactionDetails .actions {
             clear: both;
          }

          @media(max-width: 600px) {
            .TransactionDetails {
              max-height: 30rem;
            }
          }
        `}</style>

        {type === 'debit' &&
          <div className="frame">
            {transaction.attachment &&
              <a href={transaction.attachment} target="_blank" rel="noopener noreferrer" title="Open receipt in a new window">
                <img src={imagePreview(transaction.attachment)} />
              </a>
            }
            {!transaction.attachment &&
              <img src={'/static/images/receipt.svg'} />
            }
          </div>
        }
        { get(transaction, 'host.name') &&
          <div className="col">
            <label><FormattedMessage id="transaction.host" defaultMessage="host" /></label>
            {transaction.host.name} ({transaction.hostCurrency})
          </div>
        }
        <div className="col">
          <label><FormattedMessage id="transaction.paymentMethod" defaultMessage="payment method" /></label>
          {transaction.paymentMethod && capitalize(transaction.paymentMethod.service)}
        </div>
        { transaction.hostCurrencyFxRate && transaction.hostCurrencyFxRate !== 1 &&
          <div className="col">
            <label><FormattedMessage id="transaction.fxrate" defaultMessage="fx rate" /></label>
            {transaction.hostCurrencyFxRate}
          </div>
        }
        <div className="col">
          <label><FormattedMessage id="transaction.amountDetails" defaultMessage="amount details" /></label>
          <div className="amountDetails">
            { amountDetailsStr &&
              <span>
                <span>{amountDetailsStr}</span>
                <span className="netAmountInCollectiveCurrency">&nbsp;=&nbsp;</span>
              </span>
            }
            <span className="netAmountInCollectiveCurrency">
              <FormattedNumber
                value={transaction.netAmountInCollectiveCurrency / 100}
                currency={transaction.currency}
                {...this.currencyStyle}
                />
            </span>
            &nbsp;
            <span className="netAmountInCollectiveCurrencyDescription">
              (<FormattedMessage id="transaction.netAmountInCollectiveCurrency.description" defaultMessage="net amount added to your collective's balance" />)
            </span>
          </div>
        </div>
        { type === 'debit' && LoggedInUser && (LoggedInUser.canEditCollective(collective) || LoggedInUser.isRoot()) && !transaction.refundTransaction &&
          <div className="col invoice">
            <label><FormattedMessage id="transaction.invoice" defaultMessage="invoice" /></label>
            <div>
              <a href={`/${collective.slug}/transactions/${transaction.uuid}/invoice.pdf`}>
                <FormattedMessage id="transaction.downloadPDF" defaultMessage="Download (pdf)" />
              </a>
            </div>
          </div>
        }
        <div className="actions">
          { (LoggedInUser && LoggedInUser.isRoot()) &&
            <div className="transactionActions">
              <RefundTransactionBtn
                transaction={transaction}
                collective={collective}
                />
            </div> }
        </div>

      </div>
    );
  }
}

export default withIntl(TransactionDetails);
