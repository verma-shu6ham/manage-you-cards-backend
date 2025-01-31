const updateCreditCardFields = (card, actualAvailable) => {
    card.realTimeAvailableCredit = actualAvailable;
    card.realTimeOutstanding = card.creditLimit - actualAvailable;
    card.paymentDifference = card.realTimeOutstanding - card.lastKnownOutstanding;

    return card;
};

const updateCreditCardAfterTransaction = (card, transaction) => {
    const amount = Number(transaction.amount);

    if (transaction.type === 'credit') {
        card.lastKnownAvailableCredit += amount;
        card.lastKnownOutstanding -= amount;
    } else if (transaction.type === 'debit') {
        card.lastKnownAvailableCredit -= amount;
        card.lastKnownOutstanding += amount;
    }

    updateCreditCardFields(card, card.realTimeAvailableCredit);
    return card;
};

module.exports = { updateCreditCardFields, updateCreditCardAfterTransaction };
