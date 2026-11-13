import { Locator, Page, test } from '@playwright/test';
import { ADDRESS_FORM_REFILL } from '../support/address-refill';
import { refillResetAddressForm } from '../support/settings';
import type { Address, Card } from '../test-data/checkout';

/** Checkout after the cart: the step bar, Sign in, Billing Address, Payment and the order confirmation. */
export class CheckoutPage {
  /** The step bar's items (Cart, Sign in, Billing Address, Payment); the list has no label. */
  readonly steps: Locator;
  /** Shows the customer's name, which changes per account. */
  readonly signInMessage: Locator;
  readonly billingHeading: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeField: Locator;
  readonly houseNumberField: Locator;
  /** Filled in by the site from country, postal code and house number. */
  readonly streetField: Locator;
  /** The alert has no role; data-test postcode-lookup-error. */
  readonly postalCodeTooLongMessage: Locator;
  readonly addressProceedButton: Locator;
  readonly paymentMethodSelect: Locator;
  readonly confirmButton: Locator;
  readonly cardNumberError: Locator;
  readonly expiryFormatError: Locator;
  readonly expiryPastError: Locator;
  readonly cvvError: Locator;
  readonly bankNameError: Locator;
  readonly giftCardNumberError: Locator;
  /** No data-test; the invoice number changes per order. */
  readonly orderConfirmation: Locator;
  private readonly paymentWasSuccessful: Locator;
  private readonly signInProceedButton: Locator;

  constructor(private readonly page: Page) {
    this.steps = page.getByRole('list').filter({ hasText: 'Billing Address' }).getByRole('listitem');
    this.signInMessage = page.getByText(/you are already logged in/);
    this.billingHeading = page.getByRole('heading', { name: 'Billing Address' });
    this.countrySelect = page.getByLabel('Country');
    this.postalCodeField = page.getByLabel('Postal code');
    this.houseNumberField = page.getByLabel('House number');
    this.streetField = page.getByLabel('Street');
    this.postalCodeTooLongMessage = page.getByText('The postcode field must not be greater than 10 characters.');
    // The Proceed buttons of the steps share their name, so data-test tells them apart.
    this.signInProceedButton = page.getByTestId('proceed-2');
    this.addressProceedButton = page.getByTestId('proceed-3');
    this.paymentMethodSelect = page.getByLabel('Payment Method');
    this.confirmButton = page.getByRole('button', { name: 'Confirm' });
    this.cardNumberError = page.getByText('Invalid card number format.');
    this.expiryFormatError = page.getByText('Invalid date format. Use MM/YYYY.');
    this.expiryPastError = page.getByText('Expiration date must be in the future.');
    this.cvvError = page.getByText('CVV must be 3 or 4 digits.');
    this.bankNameError = page.getByText('Bank name can only contain letters and spaces.');
    this.giftCardNumberError = page.getByText('Please enter a valid gift card number: exactly 16 letters and/or digits.');
    this.orderConfirmation = page.getByText(/Thanks for your order! Your invoice number is INV-\d+/);
    this.paymentWasSuccessful = page.getByText('Payment was successful');
  }

  async proceedFromSignIn(): Promise<void> {
    await test.step('Proceed from the Sign in step', () => this.signInProceedButton.click());
  }

  async chooseCountry(name: string): Promise<void> {
    await test.step('Choose a country', () => this.countrySelect.selectOption({ label: name }).then(() => {}));
  }

  async fillPostalCode(value: string): Promise<void> {
    await test.step('Fill the postal code', () => this.postalCodeField.fill(value));
  }

  async fillHouseNumber(value: string): Promise<void> {
    await test.step('Fill the house number', () => this.houseNumberField.fill(value));
  }

  async clearHouseNumber(): Promise<void> {
    await test.step('Clear the house number', () => this.houseNumberField.clear());
  }

  /**
   * Fills the billing address and waits until the site enables Proceed (it does once it has looked the street up).
   * On the local development copy only (refillResetAddressForm), a form that was reset after it was filled (every
   * typed field empty again: Country, Postal code and House number; Street and City may keep the site's values,
   * as seen once: observed note 15) is filled again, at most twice, each time as its
   * own step and annotation, so the report and the run summary count it. The reset was seen both before and after
   * the site had filled in the street, so it is checked while waiting for Proceed. One empty field is not a reset:
   * compare note 9 (one or two typed fields empty while another still holds its value). This is the last widening of
   * what counts as a reset: if a third shape appears, the production-build copy moves from Next to Now and the
   * affected tests are left out, with their reason, until then. Returns without failing if Proceed stays disabled for another reason; the caller's check says so.
   */
  async fillAddressUntilProceedEnabled(address: Address): Promise<void> {
    await this.fillAddressUntil(address, () => this.proceedEnabledWithin(5_000));
  }

  /**
   * The way to the Payment step for 3.x and 4.x: fills the address as above and clicks Proceed. The click is part of
   * the check, because the form was also seen to reset between Proceed becoming enabled and the click. A refill
   * happens only when the click fails AND every typed field is empty; any other failed click fails the test with a
   * clear message, because a Proceed that never enables may be a real bug.
   */
  async fillAddressAndProceed(address: Address): Promise<void> {
    const proceeded = await this.fillAddressUntil(address, () =>
      test.step('Proceed from the Billing Address step', () => this.clickedWithin(this.addressProceedButton, 5_000)),
    );
    if (proceeded) return;
    // Every typed value was kept, yet Proceed stayed disabled: one longer wait for a slow lookup, then a clear failure.
    const late = await test.step('Proceed from the Billing Address step', () =>
      this.clickedWithin(this.addressProceedButton, 10_000),
    );
    if (!late) {
      throw new Error(
        'Proceed on the Billing Address step did not become enabled although every typed value was kept; this may be a bug.',
      );
    }
  }

  /** Returns true once done() succeeds; false if every typed value is kept but done() still did not succeed. */
  private async fillAddressUntil(address: Address, done: () => Promise<boolean>): Promise<boolean> {
    await test.step('Fill the billing address', () => this.typeAddress(address));
    for (let refills = 0; ; refills++) {
      if (await done()) return true;
      const typed = await Promise.all(
        [this.countrySelect, this.postalCodeField, this.houseNumberField].map((field) => field.inputValue()),
      );
      if (typed.some((value) => value !== '')) {
        if (typed.some((value) => value === '')) {
          throw new Error('The billing address lost a typed value after it was filled (compare observed note 9).');
        }
        return false; // the caller's own check or click says what is wrong
      }
      if (!refillResetAddressForm) {
        throw new Error('The billing address form was reset after it was filled (observed note 15); on this site that fails the test.');
      }
      if (refills === 2) throw new Error('The billing address form was reset twice; see observed note 15.');
      test.info().annotations.push({ type: ADDRESS_FORM_REFILL, description: 'observed note 15' });
      await test.step('Fill the billing address again (the form was reset)', () => this.typeAddress(address));
    }
  }

  async choosePaymentMethod(label: string): Promise<void> {
    await test.step('Choose a payment method', () => this.paymentMethodSelect.selectOption({ label }).then(() => {}));
  }

  async enterCardNumber(value: string): Promise<void> {
    await test.step('Enter a card number', () => this.fillAndLeave(this.page.getByTestId('credit_card_number'), value));
  }

  async enterExpiry(value: string): Promise<void> {
    await test.step('Enter an expiry date', () => this.fillAndLeave(this.page.getByTestId('expiration_date'), value));
  }

  async enterCvv(value: string): Promise<void> {
    await test.step('Enter a CVV', () => this.fillAndLeave(this.page.getByTestId('cvv'), value));
  }

  async fillCreditCard(card: Card): Promise<void> {
    await test.step('Fill the credit card', async () => {
      await this.enterCardNumber(card.number);
      await this.enterExpiry(card.expiry);
      await this.enterCvv(card.cvv);
      await this.page.getByTestId('card_holder_name').fill(card.holder);
    });
  }

  async enterBankName(value: string): Promise<void> {
    await test.step('Enter a bank name', () => this.fillAndLeave(this.page.getByLabel('Bank Name', { exact: true }), value));
  }

  async enterGiftCardNumber(value: string): Promise<void> {
    await test.step('Enter a gift card number', () =>
      this.fillAndLeave(this.page.getByLabel('Gift Card Number', { exact: true }), value),
    );
  }

  /**
   * Clicks Confirm, then clicks it again only if the site shows "Payment was successful" and stays on the Payment
   * step (observed note 7), so this works whether the site needs one click or two. First waits for either message,
   * so a slow answer is not read as "one click was enough".
   */
  async placeOrder(): Promise<void> {
    await test.step('Place the order', async () => {
      await this.confirmButton.click();
      await this.orderConfirmation.or(this.paymentWasSuccessful).first().waitFor();
      if (await this.paymentWasSuccessful.isVisible()) await this.confirmButton.click();
      await this.orderConfirmation.waitFor();
    });
  }

  /** The invoice number from the confirmation, to find the same invoice under My account. */
  async invoiceNumber(): Promise<string> {
    const text = await this.orderConfirmation.innerText();
    const match = text.match(/INV-\d+/);
    if (!match) throw new Error('The order confirmation shows no invoice number.');
    return match[0];
  }

  private async typeAddress(address: Address): Promise<void> {
    await this.chooseCountry(address.country);
    await this.fillPostalCode(address.postalCode);
    await this.fillAndLeave(this.houseNumberField, address.houseNumber); // the site looks the street up after this
  }

  /** Clicks if the element becomes clickable within the given time; false if it did not. The click itself waits. */
  private async clickedWithin(element: Locator, timeout: number): Promise<boolean> {
    return element
      .click({ timeout })
      .then(() => true)
      .catch((error: Error) => {
        if (error.name !== 'TimeoutError') throw error;
        return false;
      });
  }

  /** True once Proceed is enabled (up to the given time), false if it stayed disabled. Waits on the page, no timer. */
  private async proceedEnabledWithin(timeout: number): Promise<boolean> {
    return this.page
      .waitForFunction(
        // The live button by its data-test, so a rebuilt form is read too, not an old element.
        () => (document.querySelector('[data-test="proceed-3"]') as HTMLButtonElement | null)?.disabled === false,
        undefined,
        { timeout },
      )
      .then(() => true)
      .catch((error: Error) => {
        if (error.name !== 'TimeoutError') throw error;
        return false;
      });
  }

  private async fillAndLeave(field: Locator, value: string): Promise<void> {
    await field.fill(value);
    await field.press('Tab'); // the site checks a field when it is left
  }
}
