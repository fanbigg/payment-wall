/**
 * Payment Wall Client Application Script
 * State Management, Promo Code Logic & HitPay Endpoint Integration
 */

(function () {
  'use strict';

  // Sample Invoice Data Model
  const state = {
    referenceNumber: 'INV-2026-0849',
    clientName: 'Acme Cloud Solutions Sdn Bhd',
    items: [
      { id: 1, name: 'Cloud Infrastructure & Managed Server Hosting', qty: 1, unitPrice: 350.00 },
      { id: 2, name: 'Enterprise SSL & API Gateway Add-on', qty: 1, unitPrice: 150.00 }
    ],
    selectedChannel: 'duitnow', // 'duitnow', 'fpx', 'card'
    appliedPromo: null,
    discountAmount: 0.00,
    
    // Configured Promo Codes (e.g., incentives for low-cost rails)
    validPromos: {
      'DUITNOW10': { type: 'percent', value: 10, channelLock: 'duitnow', label: '10% DuitNow Rail Incentive' },
      'FPX5': { type: 'percent', value: 5, channelLock: 'fpx', label: '5% FPX Online Banking Incentive' },
      'SAVE20': { type: 'fixed', value: 20, channelLock: null, label: 'MYR 20 Flat Discount' }
    }
  };

  // DOM Elements
  const invoiceNumberEl = document.getElementById('invoiceNumber');
  const clientCompanyEl = document.getElementById('clientCompany');
  const invoiceItemsListEl = document.getElementById('invoiceItemsList');
  const subtotalDisplayEl = document.getElementById('subtotalDisplay');
  const discountRowEl = document.getElementById('discountRow');
  const discountLabelEl = document.getElementById('discountLabel');
  const discountDisplayEl = document.getElementById('discountDisplay');
  const totalDisplayEl = document.getElementById('totalDisplay');
  
  const customerNameInput = document.getElementById('customerName');
  const customerEmailInput = document.getElementById('customerEmail');
  const promoInput = document.getElementById('promoCodeInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoMessageEl = document.getElementById('promoMessage');
  
  const channelBtns = document.querySelectorAll('.payment-channel-btn');
  const payNowBtn = document.getElementById('payNowBtn');
  const payBtnText = document.getElementById('payBtnText');
  const payBtnSpinner = document.getElementById('payBtnSpinner');
  const errorAlertEl = document.getElementById('errorAlert');

  // Compute Subtotal
  function calculateSubtotal() {
    return state.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  }

  // Calculate Discount & Total Amount
  function recalculateTotals() {
    const subtotal = calculateSubtotal();
    let discount = 0;

    if (state.appliedPromo) {
      const promo = state.validPromos[state.appliedPromo];
      if (promo) {
        // Verify channel lock if required
        if (promo.channelLock && promo.channelLock !== state.selectedChannel) {
          // Channel lock mismatch -> invalidate promo
          showPromoMessage(`Promo code ${state.appliedPromo} requires ${promo.channelLock.toUpperCase()} payment rail.`, 'error');
          state.appliedPromo = null;
        } else {
          if (promo.type === 'percent') {
            discount = (subtotal * promo.value) / 100;
          } else if (promo.type === 'fixed') {
            discount = promo.value;
          }
        }
      }
    }

    state.discountAmount = Math.min(discount, subtotal);
    const finalTotal = Math.max(0, subtotal - state.discountAmount);

    // Update UI Elements
    subtotalDisplayEl.textContent = `MYR ${subtotal.toFixed(2)}`;
    
    if (state.discountAmount > 0 && state.appliedPromo) {
      const promoInfo = state.validPromos[state.appliedPromo];
      discountLabelEl.textContent = `${state.appliedPromo} (${promoInfo.label})`;
      discountDisplayEl.textContent = `-MYR ${state.discountAmount.toFixed(2)}`;
      discountRowEl.classList.remove('hidden');
    } else {
      discountRowEl.classList.add('hidden');
    }

    totalDisplayEl.textContent = `MYR ${finalTotal.toFixed(2)}`;
  }

  // Render Invoice Items Table
  function renderInvoiceItems() {
    invoiceItemsListEl.innerHTML = '';
    state.items.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'flex justify-between items-center py-2.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-sm';
      itemRow.innerHTML = `
        <div class="space-y-0.5">
          <p class="font-medium text-slate-200">${escapeHtml(item.name)}</p>
          <p class="text-xs text-slate-400">Qty: ${item.qty} &times; MYR ${item.unitPrice.toFixed(2)}</p>
        </div>
        <span class="font-semibold text-slate-200">MYR ${(item.qty * item.unitPrice).toFixed(2)}</span>
      `;
      invoiceItemsListEl.appendChild(itemRow);
    });
  }

  // Handle Channel Selection
  function setPaymentChannel(channel) {
    state.selectedChannel = channel;
    channelBtns.forEach(btn => {
      const btnChannel = btn.getAttribute('data-channel');
      if (btnChannel === channel) {
        btn.classList.add('active', 'border-brand-500');
        btn.classList.remove('border-slate-800');
      } else {
        btn.classList.remove('active', 'border-brand-500');
        btn.classList.add('border-slate-800');
      }
    });

    // Auto-apply promo if code matches channel logic or re-validate active promo
    recalculateTotals();
  }

  // Show Feedback Message for Promo Input
  function showPromoMessage(msg, type = 'success') {
    promoMessageEl.textContent = msg;
    promoMessageEl.classList.remove('hidden', 'text-emerald-400', 'text-red-400');
    promoMessageEl.classList.add(type === 'success' ? 'text-emerald-400' : 'text-red-400');
  }

  // Apply Promo Code Action
  function applyPromoCode() {
    const code = promoInput.value.trim().toUpperCase();
    if (!code) {
      showPromoMessage('Please enter a discount code.', 'error');
      return;
    }

    const promo = state.validPromos[code];
    if (!promo) {
      showPromoMessage('Invalid or expired promo code.', 'error');
      return;
    }

    if (promo.channelLock && promo.channelLock !== state.selectedChannel) {
      showPromoMessage(`Code ${code} is valid only for ${promo.channelLock.toUpperCase()} payment rail. Please select ${promo.channelLock.toUpperCase()} above.`, 'error');
      return;
    }

    state.appliedPromo = code;
    recalculateTotals();
    showPromoMessage(`Promo code ${code} applied successfully!`, 'success');
  }

  // Display Error Banner
  function showError(msg) {
    errorAlertEl.textContent = msg;
    errorAlertEl.classList.remove('hidden');
  }

  function clearError() {
    errorAlertEl.textContent = '';
    errorAlertEl.classList.add('hidden');
  }

  // Handle Checkout via /api/checkout Pages Function
  async function handleCheckout() {
    clearError();

    const name = customerNameInput.value.trim();
    const email = customerEmailInput.value.trim();

    if (!name || !email) {
      showError('Please complete your full name and email address before proceeding.');
      return;
    }

    const subtotal = calculateSubtotal();
    const finalAmount = subtotal - state.discountAmount;

    // Loading State
    payNowBtn.disabled = true;
    payBtnSpinner.classList.remove('hidden');
    payBtnText.textContent = 'Generating HitPay Link...';

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount.toFixed(2),
          currency: 'MYR',
          customer_name: name,
          email: email,
          payment_option: state.selectedChannel,
          discount_code: state.appliedPromo,
          reference_number: state.referenceNumber
        })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to generate payment link.');
      }

      // Redirect to HitPay Checkout URL (or success page if mock mode)
      window.location.href = data.url;

    } catch (err) {
      showError(err.message || 'An error occurred while contacting the checkout service.');
      payNowBtn.disabled = false;
      payBtnSpinner.classList.add('hidden');
      payBtnText.textContent = 'Proceed to HitPay Checkout';
    }
  }

  // Helper Utility
  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Attach Event Listeners
  function init() {
    invoiceNumberEl.textContent = state.referenceNumber;
    clientCompanyEl.textContent = state.clientName;

    renderInvoiceItems();
    recalculateTotals();

    // Payment Rail selector clicks
    channelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const channel = btn.getAttribute('data-channel');
        setPaymentChannel(channel);
      });
    });

    applyPromoBtn.addEventListener('click', applyPromoCode);
    promoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyPromoCode();
      }
    });

    payNowBtn.addEventListener('click', handleCheckout);
  }

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', init);

})();
