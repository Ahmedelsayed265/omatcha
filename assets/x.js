function getCartApi() {
  if (typeof zid === 'undefined') return null;
  if (zid.cart && typeof zid.cart.get === 'function') {
    return {
      get: function() { return zid.cart.get(); },
      addProduct: function(opts) {
        var productId = opts.productId || opts.product_id;
        var quantity = opts.quantity || 1;
        return zid.cart.addProduct({ product_id: productId, quantity: quantity }, { showErrorNotification: true });
      },
      removeProduct: function(id) {
        return zid.cart.removeProduct({ product_id: id });
      },
      updateProduct: function(productId, quantity) {
        return zid.cart.updateProduct({ product_id: productId, quantity: parseInt(quantity, 10) });
      }
    };
  }
  if (zid.store && zid.store.cart) {
    return {
      get: function() {
        return zid.store.cart.fetch().then(function(r) {
          if (r.status === 'success' && r.data && r.data.cart) return r.data.cart;
          return r;
        });
      },
      addProduct: function(opts) {
        var productId = opts.productId || opts.product_id;
        var quantity = opts.quantity || 1;
        return zid.store.cart.addProduct({ productId: productId, quantity: quantity });
      },
      removeProduct: function(id) {
        return zid.store.cart.removeProduct(id);
      },
      updateProduct: function(productId, quantity) {
        return zid.store.cart.updateProduct(productId, quantity);
      }
    };
  }
  return null;
}

document.addEventListener("DOMContentLoaded", function() {
  var api = getCartApi();
  if (api) fetchCart();
  var myOffcanvas = document.getElementById('side-cart');

  if (myOffcanvas) {
    myOffcanvas.addEventListener('hidden.bs.offcanvas', () => {
      $('.item-inside-cart').html('');
      $('.loading-cart').removeClass('d-none');
      $('.footer-side-cart').addClass('d-none');
      $('.btn-close-offcanvas').addClass('d-none');
    });

    myOffcanvas.addEventListener('show.bs.offcanvas', () => {
      $('.loading-cart').addClass('d-none');
      fetchCart();
    });
  }
});

function productCartAddToCart(elm, product_id) {
  const $elm = $(elm);
  if ($elm.find('.spinner-border').length > 0) return;

  $('.loading-cart').removeClass('d-none');
  const originalHtml = $elm.html();
  $elm.html(`<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>`);

  addToCart(product_id, 1, () => {
    $elm.html(originalHtml);
    fetchCart();
    const sideCart = document.getElementById('side-cart');
    if (sideCart) new bootstrap.Offcanvas(sideCart).show();
  });
}

function addToCart(product_id, quantity, onCompleted) {
  var api = getCartApi();
  if (!api) { if (onCompleted) onCompleted(); return; }
  api.addProduct({ product_id: product_id, quantity: quantity }).then(function(response) {
    var cart = (response && response.data && response.data.cart) ? response.data.cart : response;
    if (cart || (response && response.status === 'success')) {
      if (cart) setCartTotalAndBadge(cart);
      else if (response.data && response.data.cart) setCartTotalAndBadge(response.data.cart);
      if (onCompleted) onCompleted();
    }
  }).catch(function() {
    if (onCompleted) onCompleted();
  });
}

function setCartTotalAndBadge(cart) {
  const actualCart = cart?.data?.cart || cart;
  if (actualCart && actualCart.products_count !== undefined) {
    setCartBadge(actualCart.products_count);
  }
  const cartTotal = getCartTotal(actualCart);
  if (cartTotal) setCartIconTotal(cartTotal);
}

function setCartIconTotal(total) {
  $('.cart-price').html(total).removeClass('d-none');
}

function setCartBadge(badge) {
  $('.cart-badge').html(badge);
  $('.cart-count').html(badge);
}

function displayActivePaymentSessionBar(cart) {
  if (cart && cart.is_reserved !== undefined) {
    $('.payment-session-bar').toggleClass('d-none', !cart.is_reserved);
  }
}

function getCartTotal(cart) {
  if (!cart || !cart.totals) return null;
  const totalItem = cart.totals.find(total => total.code === 'total');
  return totalItem?.value_string || null;
}

function createCartProduct(product) {
  if (!product || !product.images || !product.images[0]) return '';
  const priceColorStyle = window.priceColor ? ` style="color: ${window.priceColor};"` : '';
  const oldPrice = product.price_before_string
    ? `<span class="price-discount"><span class="price"${priceColorStyle}>${product.price_string}</span><del class="old">${product.price_before_string}</del></span>`
    : `<span class="product-price"${priceColorStyle}>${product.price_string}</span>`;
  const imageUrl = product.images[0].origin;

  return `
    <li id="product_${product.id}">
      <div class="flex-product-box">
        <div class="img-product-box">
          <a href="${product.url}"><img src="${imageUrl}" alt="${product.name}"></a>
        </div>
        <div class="product-info-box">
          <button class="remove" onclick="return removeItem('${product.id}', this)" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
                <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M9.5 16.5L9.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M14.5 16.5L14.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
          <h4 class="title-product-m">${product.name}</h4>
          <div class="price-old-new">
            <div class="price">${oldPrice}</div>
          </div>
          <div class="block-p-qty">
            <button class="button-plus btn-number" type="button" data-type="plus" data-field="quantity_${product.id}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none">
                <path d="M12 4V20M20 12H4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            </button>
            <input type="text" name="quantity_${product.id}" min="1" max="100" class="input-number" value="${product.quantity}" onchange="updateMiniCartProduct('${product.id}', this.value)" readonly>
            <button class="button-minus btn-number" data-type="minus" data-field="quantity_${product.id}" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none">
                  <path d="M20 12L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </li>`;
}

function createCartProductBundle(item) {
  if (!item.product_x || !item.product_y) return '';
  return [...item.product_x, ...item.product_y].map(createCartProduct).filter(Boolean).join('');
}

function fetchCart() {
  var api = getCartApi();
  if (!api) {
    $('.loading-cart').addClass('d-none');
    return;
  }
  $('.loading-cart').removeClass('d-none');
  $('.cart-rules').addClass('d-none');
  $('#additional-cart').html('');
  $('.side-cart-items').removeClass('d-none');
  var emptyText = $('#side-cart').data('empty') || (window.i18n && window.i18n.empty_cart_text) || 'There are no products in your cart';

  api.get().then(function(cart) {
    if (!cart) return;
    var itemsHtml = '';
    var totalsHtml = '';
    var responseForRules = { data: { cart: cart } };

    if (cart.products_count !== undefined) $('.cart-count').html(cart.products_count);

    if (cart.products_count > 0 && cart.products && cart.products.length) {
      cart.products.forEach(function(product) {
        var html = product.bundle_name ? createCartProductBundle(product) : createCartProduct(product);
        if (html) itemsHtml += html;
      });

      if (cart.totals && cart.totals.length) {
        cart.totals.forEach(function(total) {
          totalsHtml += '<li id="' + total.code + '" class="d-flex justify-content-between">' +
            '<span class="title">' + total.title + '</span>' +
            '<span class="number">' + total.value_string + '</span></li>';
        });
      }

      $('#cart-side-totals').html(totalsHtml);
      $('.side-cart-items').html(itemsHtml);
      $('.footer-side-cart').removeClass('d-none');
      $('.btn-close-offcanvas').removeClass('d-none');

      setTimeout(function() {
        if (typeof window.checkSideCartDifferentVersions === 'function') window.checkSideCartDifferentVersions();
        else if (typeof checkSideCartDifferentVersions === 'function') checkSideCartDifferentVersions();
      }, 200);
    } else {
      $('#additional-cart').html(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" color="#ffffff" fill="none">' +
        '<path d="M8 16H15.2632C19.7508 16 20.4333 13.1808 21.261 9.06908C21.4998 7.88311 21.6192 7.29013 21.3321 6.89507C21.045 6.5 20.4947 6.5 19.3941 6.5H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />' +
        '<path d="M8 16L5.37873 3.51493C5.15615 2.62459 4.35618 2 3.43845 2H2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />' +
        '<path d="M8.88 16H8.46857C7.10522 16 6 17.1513 6 18.5714C6 18.8081 6.1842 19 6.41143 19H17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />' +
        '<circle cx="10.5" cy="20.5" r="1.5" stroke="currentColor" stroke-width="1.5" />' +
        '<circle cx="17.5" cy="20.5" r="1.5" stroke="currentColor" stroke-width="1.5" />' +
        '</svg><p>' + emptyText + '</p>');
      $('#cart-side-totals, .side-cart-items').html('');
      $('.footer-side-cart').addClass('d-none');
      $('.cart-rules').addClass('d-none');
    }

    setCartTotalAndBadge(cart);

    if (cart.products_count > 0 && cart.discount_rules && cart.discount_rules.length) {
      var foundFreeShipping = false;
      var currency = (cart.currency && cart.currency.cart_currency && cart.currency.cart_currency.symbol) ? cart.currency.cart_currency.symbol : '';
      cart.discount_rules.forEach(function(rule) {
        if (rule.code === 'free_shipping' && rule.enabled && cart.fee_shipping_discount_rules) {
          foundFreeShipping = true;
          $('.cart-rules').removeClass('d-none');
          templateRules(rule, responseForRules, currency, cart.fee_shipping_discount_rules);
        }
      });
      if (!foundFreeShipping) $('.cart-rules').addClass('d-none');
    }

    displayActivePaymentSessionBar(cart);
  }).catch(function() {
    $('.loading-cart').addClass('d-none');
  }).finally(function() {
    $('.loading-cart').addClass('d-none');
  });
}



const rtl_mode = $("body").hasClass("rtl");
function templateRules(rule, response, currency, fee_shipping_discount_rules) {
  if (!rule.conditions || !rule.conditions[0] || !rule.conditions[0].value) return;
  let min_value = rule.conditions[0].value[0];
  let remain_raw = min_value - response.data.cart.products_subtotal;

  let remain_value = remain_raw > 0
    ? (Number.isInteger(remain_raw) ? remain_raw : remain_raw.toFixed(2))
    : 0;

  let percentage = Math.ceil(
    fee_shipping_discount_rules.conditions_subtotal.status.code !== 'applied'
      ? 100 - ((remain_value * 100) / min_value)
      : 100
  );

  if (fee_shipping_discount_rules.conditions_subtotal.status.code !== 'applied') {
    $(".cart-rules").removeClass('d-none');
    $(".cart-rules").html(` 
      <div class="shipping-progress active progress">
          <span class="progress-bar" role="progressbar"
                style="width: ${percentage}%;" 
                aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></span>
          <div class="progress-value" style="right: calc(${percentage}% - 12px);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
            </svg>
          </div>
        </div>
      <div class="shipping-rule-message">
        ${rtl_mode ? "أضف مشتريات بقيمة" : "Add products worth"} 
        <span class="value">${remain_value}</span>
        <span class="currency">${currency}</span>
        <span class="new-line">
          ${rtl_mode ? "للحصول على شحن مجاني" : "to get Free Shipping"}
        </span>
      </div>
    `);
  } else {
    $(".cart-rules").html(`
      <div class="shipping-progress active progress">
          <span class="progress-bar" role="progressbar"
                style="width: ${percentage}%;" 
                aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></span>
          <div class="progress-value" style="right: calc(${percentage}% - 12px);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
            </svg>
          </div>
        </div>
      <div class="shipping-rule-message">                       
        ${rtl_mode ? "🎉 حصلت على شحن مجاني!" : "🎉 Shipping is Free Now!"}
      </div>
    `);
  }
}

var removeButtonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
  <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  <path d="M9.5 16.5L9.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  <path d="M14.5 16.5L14.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
</svg>`;

function removeItem(key, item) {
  var api = getCartApi();
  if (!api) return;
  $('.side-cart-items li#product_' + key + ' .remove').html('<i class="cart-spinner fa-spin"></i>');
  api.removeProduct(key).then(function(response) {
    var ok = response && (response.status === 'success' || response.id || response === true);
    if (ok || response) fetchCart();
  }).catch(function() {
    $('.side-cart-items li#product_' + key + ' .remove').html(removeButtonSvg);
  });
}

$(document).on('click', '.btn-number', function (e) {
  e.preventDefault();
  const type = $(this).attr('data-type');
  const fieldName = $(this).attr('data-field');
  const input = $(`input[name='${fieldName}']`);
  let currentVal = parseInt(input.val(), 10);
  const minVal = parseInt(input.attr('min'), 10) || 1;
  const maxVal = parseInt(input.attr('max'), 10) || 100;

  if (isNaN(currentVal)) return;
  var newVal = currentVal;
  if (type === 'plus' && currentVal < maxVal) newVal = currentVal + 1;
  else if (type === 'minus' && currentVal > minVal) newVal = currentVal - 1;
  if (newVal !== currentVal) {
    input.val(newVal);
    var productId = fieldName.replace('quantity_', '');
    updateMiniCartProduct(productId, newVal, currentVal);
  }
});

function updateMiniCartProduct(productId, quantity, previousQuantity) {
  var api = getCartApi();
  if (!api) return;
  var cartItems = $('.side-cart-items');
  cartItems.fadeTo('slow', 0.3);

  api.updateProduct(productId, quantity).then(function(response) {
    cartItems.fadeTo('slow', 1);
    var ok = response && (response.status === 'success' || response.id || response === true);
    if (ok || response) {
      fetchCart();
    } else {
      if (previousQuantity !== undefined) {
        var input = $('input[name="quantity_' + productId + '"]');
        if (input.length) input.val(previousQuantity);
      }
      var msg = (response && response.data && response.data.message) || (window.i18n && window.i18n.requested_quantity_not_available) || 'Error updating quantity';
      if (window.zid && window.zid.toaster) window.zid.toaster.showError(msg);
      else if (typeof $.toast === 'function') $.toast({ text: msg, bgColor: '#d90000', textColor: '#fff' });
    }
  }).catch(function(err) {
    cartItems.fadeTo('slow', 1);
    if (previousQuantity !== undefined) {
      var input = $('input[name="quantity_' + productId + '"]');
      if (input.length) input.val(previousQuantity);
    }
    var msg = (err && err.response && err.response.data && err.response.data.message) || (window.i18n && window.i18n.requested_quantity_not_available) || 'Error updating quantity';
    if (window.zid && window.zid.toaster) window.zid.toaster.showError(msg);
  });
}

// Side cart: show alert when mixing capsule vs non-capsule products (AR/EN)
window.checkSideCartDifferentVersions = function() {
  var alertDiv = document.getElementById('side-cart-versions-alert');
  if (!alertDiv) return;

  var cartItems = document.querySelectorAll('.side-cart-items li');
  if (cartItems.length < 2) {
    alertDiv.classList.add('d-none');
    return;
  }

  var hasProductWithKabsoolat = false;
  var hasProductWithoutKabsoolat = false;
  var hasProductWithCapsule = false;
  var hasProductWithoutCapsule = false;

  cartItems.forEach(function(item) {
    var productName = '';
    var titleEl = item.querySelector('.title-product-m');
    if (titleEl) productName = titleEl.textContent.trim();
    if (!productName) {
      var img = item.querySelector('img');
      if (img) productName = img.getAttribute('alt') || '';
    }
    if (!productName) return;

    var productNameLower = productName.toLowerCase();
    if (productName.includes('كبسولات')) hasProductWithKabsoolat = true;
    else hasProductWithoutKabsoolat = true;
    if (productNameLower.includes('capsule')) hasProductWithCapsule = true;
    else hasProductWithoutCapsule = true;
  });

  var shouldShowAlert = (hasProductWithKabsoolat && hasProductWithoutKabsoolat) ||
    (hasProductWithCapsule && hasProductWithoutCapsule);
  alertDiv.classList.toggle('d-none', !shouldShowAlert);
};
