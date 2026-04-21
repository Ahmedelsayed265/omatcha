var fixed_header;
var sticky;
var cart_products = [];


function handleLoginAction(redirectTo = "", addToUrl = true) {
  if (window.customerAuthState && window.customerAuthState.isAuthenticated) {
    return;
  }

  if (
    window.auth_dialog &&
    window.auth_dialog.open &&
    typeof window.auth_dialog.open === "function"
  ) {
    if (redirectTo && addToUrl) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("redirect_to", redirectTo);
      window.history.replaceState({}, "", currentUrl.toString());
    }

    window.auth_dialog.open();
  } else {
    const redirectUrl = redirectTo
      ? `/auth/login?redirect_to=${encodeURIComponent(redirectTo)}`
      : "/auth/login";
    window.location.href = redirectUrl;
  }
}

window.addEventListener('scroll', fixed_header_to_top, { passive: true });

function menuFiixedHeader() {
  fixed_header = document.getElementById("fixed-header");
  if (fixed_header) sticky = fixed_header.offsetTop;
}

function fixed_header_to_top() {
    if (window.scrollY > 250) {
        if(fixed_header) {
            fixed_header.classList.add("sticky");
        }
    } else {
        if(fixed_header) {
            fixed_header.classList.remove("sticky");
        }
    }
}


function showDropItems() {
    var dropitems = document.getElementById('women-dropitmes');
    if (dropitems) { dropitems.classList.remove('dropitems'); dropitems.classList.add('dropitems-shown'); }
}

function hideDropItems() {
    var dropitems = document.getElementById('women-dropitmes');
    if (dropitems) { dropitems.classList.remove('dropitems-shown'); dropitems.classList.add('dropitems'); }
}


function hideDropDownMenu() {
    elem.classList.remove('dropitems-shown')
    elem.classList.add('dropitems')
}


function rowSlideRight(selector) {
    var container = document.querySelector(selector);
    if (!container) return;
    requestAnimationFrame(function() { container.scrollLeft = 0; });
}

function rowSlideLeft(selector) {
    var container = document.querySelector(selector);
    if (!container) return;
    requestAnimationFrame(function() { container.scrollLeft = -container.offsetWidth; });
}

function hideAnnouncementBar() {
    $('.announcement-bar').addClass('d-none');
}

function hideAvailabilityBar() {
    $('.availability-bar').addClass('d-none');
}

/* 
    Cart
*/

function hideElmById(id) {
  document.getElementById(id).style.display = 'none';
}

function showShoppingCart() {
  document.getElementById('header-shopping-cart').style.width = '40%';
  document.body.classList.add('disable-scroll');
  addCartItem();
}

function hideShoppingCart() {
  document.getElementById('header-shopping-cart').style.width = '0%';
  document.body.classList.remove('disable-scroll');
  removeCartItems();
  hideElmById('empty-cart');
}

function getCartTotal() {
  return cart_products.reduce((acc, product) => acc + product.price * product.quantity, 0);
}

function getCartItemHTML(product) {
  return `
        <div id="cart-item-${product.id}" class="cart-item d-flex flex-row">
            <div class="cart-item-img"></div>
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">${product.price_string}</div>
            <div class="cart-item-quantity">${product.quantity}</div>
            <div class="cart-item-total">${product.price * product.quantity} ${localStorage.getItem('currency')}</div>
        </div>
    `;
}

function addCartItem() {
  let cart = document.getElementById('cart-items');
  cart.innerHTML = '';
  cart.style.display = 'flex';

  let empty_cart = document.getElementById('empty-cart');

  if (cart_products.length === 0) {
    empty_cart.style.display = 'flex';

    return;
  }

  cart_products.forEach(product => cart.insertAdjacentHTML('beforeend', getCartItemHTML(product)));
}

function removeCartItems() {
  let cart = document.getElementById('cart-items');
  cart.innerHTML = '';
}

function updateCartProducts(res) {
  let added_product = res.data.cart.product;
  let i = cart_products.findIndex(item => item.product_id == added_product.product_id);
  i > -1 ? (cart_products[i] = added_product) : cart_products.push(added_product);

  let quantity = cart_products.reduce((acc, product) => acc + product.quantity, 0);
  setCartCount(quantity);
}

function removeFromCartProducts(res, product_id) {
  let i = cart_products.findIndex(item => item.product_id === product_id);

  if (i > -1) {
    cart_products.splice(i, 1);
  }

  let quantity = cart_products.reduce((acc, product) => acc + product.quantity, 0);
  setCartCount(quantity);
}

function productCartAddToCart(elm, product_id) {
  if (!$('.add-to-cart-progress', elm).hasClass('d-none')) return;

  $('.add-to-cart-progress', elm).removeClass('d-none');

  addToCart(product_id, 1, function () {
    $('.add-to-cart-progress', elm).addClass('d-none');

    if (elm) {
      var getParentDiv = $(elm).parent().parent();

      var image = $('#product-card-img-' + product_id, getParentDiv);
      var cart = $('.a-shopping-cart');

      addToCartAnimation(cart, image);
    }
  });
}

function addToCart(product_id, quantity, onCompleted) {
  zid.cart
    .addProduct({ product_id: product_id,quantity: quantity, }, { showErrorNotification: true })
    .then(function (response) {
      if (response) {
        setCartTotalAndBadge(response);
        fetchCart();
        if (onCompleted) {
          onCompleted();
        }
      }
    });
}

function removeFromCart(product_id) {
  product_id_str = product_id.replaceAll('-', '');
  let i = cart_products.findIndex(item => item.product_id == product_id_str);

  zid.cart
    .removeProduct({ product_id: cart_products[i].id }, {showErrorNotification: true})
    .then(res => removeFromCartProducts(res, product_id_str));
}

function fillWishlistItems(items) {
  items.forEach(product => {
    const container = $(`.add-to-wishlist[data-wishlist-id=${product.id}]`)[0];
    if (!container) return;

    // Find the filled button (with zid-visible-wishlist attribute)
    const filledButton = container.querySelector(`[zid-visible-wishlist="${product.id}"]`);
    // Find the empty button (with zid-hidden-wishlist attribute or without filled class)
    const emptyButton = container.querySelector(`[zid-hidden-wishlist="${product.id}"]`) ||
                        container.querySelector('.icon-heart-mask:not(.filled)');

    // Show filled button, hide empty button
    if (filledButton) {
      filledButton.style.setProperty('display', 'inline-block', 'important');
      filledButton.classList.add('filled');
    }
    if (emptyButton) {
      emptyButton.style.setProperty('display', 'none', 'important');
    }
  });
}

function addToWishlist(elm, productId) {
  const container = $(elm).closest('.add-to-wishlist');

  // Hide ALL heart buttons and show loader
  container.find('.icon-heart-mask').each(function() {
    this.style.setProperty('display', 'none', 'important');
  });
  container.find('.loader').removeClass('d-none');

  // Remove From Wishlist if added
  if ($(elm).hasClass('filled')) {
    return removeFromWishlist(elm, productId);
  }

  zid.account.addToWishlists({ product_ids: [productId] }, { showErrorNotification: true }).then(response => {
    if (response) {
      container.find('.loader').addClass('d-none');

      // Hide the empty button, show the filled button
      const filledButton = container.find(`[zid-visible-wishlist="${productId}"]`)[0];
      const emptyButton = container.find(`[zid-hidden-wishlist="${productId}"]`)[0] ||
                          container.find('.icon-heart-mask:not([zid-visible-wishlist])')[0];

      if (filledButton) {
        filledButton.style.setProperty('display', 'inline-block', 'important');
        filledButton.classList.add('filled');
      } else {
        elm.style.setProperty('display', 'inline-block', 'important');
        $(elm).addClass('filled');
      }

      if (emptyButton) {
        emptyButton.style.setProperty('display', 'none', 'important');
      }

      // toastr.success(response.data.message);
    } else {
      // toastr.error(response.data.message);
      // Show the original button back on error
      elm.style.setProperty('display', 'inline-block', 'important');
      container.find('.loader').addClass('d-none');
    }
  });
}

function removeFromWishlist(elm, productId) {
  const container = $(elm).closest('.add-to-wishlist');

  // Hide ALL heart buttons and show loader
  container.find('.icon-heart-mask').each(function() {
    this.style.setProperty('display', 'none', 'important');
  });
  container.find('.loader').removeClass('d-none');

  zid.account.removeFromWishlist(productId, { showErrorNotification: true }).then(response => {
    container.find('.loader').addClass('d-none');

    if (location.pathname === '/account-wishlist') {
      location.reload();
      return;
    }

    // Hide the filled button, show the empty button
    const filledButton = container.find(`[zid-visible-wishlist="${productId}"]`)[0];
    const emptyButton = container.find(`[zid-hidden-wishlist="${productId}"]`)[0] ||
                        container.find('.icon-heart-mask:not([zid-visible-wishlist])')[0];

    if (emptyButton) {
      emptyButton.style.setProperty('display', 'inline-block', 'important');
      emptyButton.classList.remove('filled');
    } else {
      elm.style.setProperty('display', 'inline-block', 'important');
      $(elm).removeClass('filled');
    }

    if (filledButton) {
      filledButton.style.setProperty('display', 'none', 'important');
      filledButton.classList.remove('filled');
    }
  }).catch(error => {
    console.error('Failed to remove from wishlist:', error);
    // Show the original button back on error
    elm.style.setProperty('display', 'inline-block', 'important');
    container.find('.loader').addClass('d-none');
  });
}

function shareWishlist() {
  $('.share-wishlist .loader').removeClass('d-none').siblings('.share-icon').addClass('d-none');

  zid.account.shareWishlist({ showErrorNotification: true }).then(async response => {
    if (response) {
      $('.share-wishlist .loader').addClass('d-none').siblings('.share-icon').removeClass('d-none');

      if (response.data.link) {
        try {
          await navigator.clipboard.writeText(response.data.link);
          toastr.success(response.data.message);
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      toastr.error(response.data.message);
    }
  });
}



/*
    Initialize Cart
*/



/*
    mega-menu
*/
jQuery(document).on('click', '.mega-dropdown', function(e) {
    e.stopPropagation()
  })

 /*
 slider-filter
 */
 $( function() {
    $( "#slider-range" ).slider({
      range: true,
      min: 0,
      max: 500,
      values: [ 75, 300 ],
      slide: function( event, ui ) {
        $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
      }
    });
    $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
      " - $" + $( "#slider-range" ).slider( "values", 1 ) );
  } );

     
  /*
 product-comment-twig show more show less
 */
 $('#show-more-content').hide();

 $('#show-more').click(function(){
     $('#show-more-content').show(500);
     $('#show-less').show();
     $('#show-more').hide();
 });
 
 $('#show-less').click(function(){
     $('#show-more-content').hide(500);
     $('#show-more').show();
     $(this).hide();
 });

function displayActivePaymentSessionBar(cart) {
  if (cart && cart.is_reserved) $('.payment-session-bar').removeClass('d-none');
}

function fetchCart() {
    zid.store.cart.fetch().then(function (response) {
        if(response.status  === 'success'){
            if(response.data) {
                setCartTotalAndBadge(response.data.cart);
                displayActivePaymentSessionBar(response.data.cart);
            }
        }
    })
}

function getCartTotal(cart) {
    if(cart && cart.totals && cart.totals.length > 0){
        var cartTotalItem = cart.totals.filter(function (total) {
            return (total.code === 'total')
        })

        if(cartTotalItem.length > 0){
            return cartTotalItem[0].value_string;
        }
    }

    return null;
}

function setCartTotalAndBadge(cart) {
  var actualCart = (cart && cart.data && cart.data.cart) ? cart.data.cart : cart;
  if (!actualCart) return;
  var count = actualCart.cart_items_quantity != null ? actualCart.cart_items_quantity : actualCart.products_count;
  setCartBadge(count);
  var cartTotal = getCartTotal(actualCart);
  if (cartTotal) setCartIconTotal(cartTotal);
}

function setCartIconTotal(total) {
    $('.cart-header-total').html(total)
}

function setCartBadge(badge) {
    if(badge > 0){
        $('.cart-badge').html(badge);
        showGiftCart();
    }
}

function showGiftCart() {
    if (location.pathname !== '/cart/view') {
      $('#tooltip').removeClass('d-none');
      setTimeout(() => {
        $('#tooltip').addClass('d-none');
      }, 3000);
    }
}

function closeSlidingMenu () {
    window.slidingMenu.close()
}


function clearFilters () {
    $('.form-products-filter input').val('');
    const cleanURL = window.location.origin + window.location.pathname;
    window.location.href = cleanURL;
}


$('.sm-search-icon').click(function() {
    $('.sm-search-div').toggleClass('show');
});

$('#filters-form-collapse-sm').on('hidden.bs.collapse', function () {
    $('.filters_expanded').removeClass('d-none')
    $('.filters_not_expanded').addClass('d-none')
})

$('#filters-form-collapse-sm').on('shown.bs.collapse', function () {
    $('.filters_expanded').addClass('d-none')
    $('.filters_not_expanded').removeClass('d-none')
})


function getMenuPrev(elm) {
    if(!elm)
        return null;

    var EPrev = $(elm).prev();
    if(EPrev){
      if(EPrev.hasClass('d-none')) {
          return getMenuPrev(EPrev);
      } else {
          return EPrev;
      }
    }

    return null;
}

function fixMenu(prevLiElm){

    var listItems = $(".main-nav > li");

    listItems.each(function(idx, li) {
        if(idx > 3){
            if(!$(li).hasClass('all-categories') && !$(li).hasClass('d-none')){
                if(($(li).offset().top - $(li).parent().offset().top) > 4){
                    $(li).addClass('d-none');
                }else{
                    $(li).removeClass('d-none');
                }
            }
        }
    });

    var elmAllCat = $(".main-nav > li.all-categories")
    if($(elmAllCat).length){
        if(($(elmAllCat).offset().top - $(elmAllCat).parent().offset().top) > 4){
            var pElm = null;
             if(prevLiElm){
                 pElm = getMenuPrev(prevLiElm);
             } else {
                 pElm =  getMenuPrev(elmAllCat);
             }
            $(pElm).addClass('d-none');
            fixMenu(pElm)
        }
    }


    if(($('.main-nav').parent().outerWidth() - $('.main-nav').outerWidth()) < 100 ) {
        $('.main-nav').addClass('justify-content-between');
    }else{
        $('.main-nav').removeClass('justify-content-between');
    }


    if($('.main-nav-wrapper').length) {
        $('.main-nav-wrapper').removeClass('main-nav-wrapper');
    }

}

var resizeTimeout;
$(window).resize(function() {
    if (resizeTimeout) return;
    resizeTimeout = requestAnimationFrame(function() {
        resizeTimeout = null;
        fixMenu();
    });
});

$('.search-input-input').on('keyup', function (e) {
  if (e.key === 'Enter' || e.keyCode === 13) {
    window.location.href = '/products?q=' + encodeURI(this.value);
  }
});

//$( document ).ready(function() {
document.addEventListener("DOMContentLoaded", function(){

    fetchCart();
    productsQuestions.checkAddQuestionPossibility();

    /* mobile slide menu */
    // window.slidingMenuElement = document.getElementById('sliding-menu');
    // window.slidingMenu = new SlideMenu(window.slidingMenuElement,{
    //     position: (window.appDirection === 'ltr') ? 'left' : 'right',
    //     showBackLink: true,
    //     backLinkBefore: (window.appDirection === 'ltr') ? '<span class="icon-arrow_left slide-menu-arrow slide-menu-arrow-back"></span>' : '<span class="icon-arrow_right slide-menu-arrow slide-menu-arrow-back"></span>',
    //     submenuLinkAfter: (window.appDirection === 'ltr') ? '<span class="icon-arrow_right slide-menu-arrow"></span>' : '<span class="icon-arrow_left slide-menu-arrow"></span>'
    // });

    // window.slidingMenuElement.addEventListener('sm.open', function () {
    //     $('body').addClass('sidenav-open');
    // });

    // window.slidingMenuElement.addEventListener('sm.close', function () {
    //     $('body').removeClass('sidenav-open');
    // });

    $(".search-input-input").on("input", function(event){

        fetchProductsSearchDebounce(event.currentTarget)
    });

    /* mobile slide menu */
    fixMenu();

    menuFiixedHeader();
});


var fetchProductsSearchDebounce =  debounce(function(target){
    fetchProductsSearch($(target).attr('data-cat-id') , $(target).val())
}, 650);

function fetchProductsSearch(catId, query) {
  if (!query || query.trim().length <= 0) {
      $('.autocomplete-items').html('').removeClass('has-data');
      return;
  }

  zid.store.product.fetchAll(catId, { per_page: 5, search: encodeURI(query) }).then(function (response) {
      if (response.status === 'success') {
          if (response.data && response.data.products && response.data.products.data && response.data.products.data.length > 0) {
              $('.autocomplete-items').html('').addClass('has-data');
              for (var i = 0; i < response.data.products.data.length; i++) {
                  var product = response.data.products.data[i];
                  $('.autocomplete-items').append('<div><a href="' + product.html_url + '">' + product.name + '</a></div>');
              }
          } else {
              $('.autocomplete-items').html('').removeClass('has-data');
          }
      }
  });
}


function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};


function sessionLangCurrencyChange() {
    var currency = $('.select-country option:selected').attr('data-currency');
    var currencySymbol = $('.select-country option:selected').attr('data-currency-symbol');

    $('#input-change-session-currency').val(currency);
    $('#input-change-session-currency-symbol').val(currencySymbol);
}


function addToCartAnimation(cart,imgtodrag) {
    if (imgtodrag && cart) {
        var imgclone = imgtodrag.clone()
            .offset({
                top: imgtodrag.offset().top,
                left: imgtodrag.offset().left
            })
            .css({
                'opacity': '0.5',
                'position': 'absolute',
                'height': '150px',
                'width': '150px',
                'z-index': '100'
            })
            .appendTo($('body'))
            .animate({
                'top': cart.offset().top + 10,
                'left': cart.offset().left + 10,
                'width': 75,
                'height': 75
            }, 1000, 'easeInOutExpo');

        imgclone.animate({
            'width': 0,
            'height': 0
        }, function () {
            $(this).detach()
        });
    }
}


function sendCoupon(element) {
  const $form = $(element).closest('.coupon-form');
  const $input = $form.find('.send-coupon');
  const $spinner = $form.find('.send-coupon-progress');

  if (!$spinner.hasClass('d-none')) return;
  $spinner.removeClass('d-none');

  const couponCode = $input.val();

  window.loadToasterScriptIfNotLoaded(function () {
    const zidObj = window.zid || (typeof zid !== 'undefined' ? zid : null);
    
    // Try modern API first
    if (zidObj && zidObj.cart && typeof zidObj.cart.applyCoupon === 'function') {
      zidObj.cart.applyCoupon({ coupon_code: couponCode }, { showErrorNotification: true })
        .then(function () {
          $spinner.addClass('d-none');
          if (typeof toastr !== 'undefined') toastr.success(window.i18n ? window.i18n.success : 'Success');
          window.location.href = '/cart/view';
        })
        .catch(function () {
          $spinner.addClass('d-none');
        });
    } 
    // Fallback to legacy API
    else if (zidObj && zidObj.store && zidObj.store.cart && typeof zidObj.store.cart.redeemCoupon === 'function') {
      zidObj.store.cart.redeemCoupon(couponCode)
        .then(function (response) {
          if (response.status === 'success') {
            if (typeof toastr !== 'undefined') toastr.success(window.i18n ? window.i18n.success : 'Success');
            window.location.href = '/cart/view';
          } else {
            if (typeof toastr !== 'undefined') toastr.error(response.data && response.data.message ? response.data.message : (window.i18n ? window.i18n.error : 'Error'));
          }
          $spinner.addClass('d-none');
        }).catch(function () {
          $spinner.addClass('d-none');
        });
    } else {
      $spinner.addClass('d-none');
      console.warn('Zid coupon API not found');
    }
  });
}

function deleteCoupon(element) {
  const $form = $(element).closest('.coupon-form');
  const $spinner = $form.find('.delete-coupon-progress');

  if (!$spinner.hasClass('d-none')) return;
  $spinner.removeClass('d-none');

  window.loadToasterScriptIfNotLoaded(function () {
    const zidObj = window.zid || (typeof zid !== 'undefined' ? zid : null);

    // Try modern API first
    if (zidObj && zidObj.cart && typeof zidObj.cart.removeCoupons === 'function') {
      zidObj.cart.removeCoupons({ showErrorNotification: true })
        .then(function () {
          $spinner.addClass('d-none');
          window.location.reload();
        })
        .catch(function () {
          $spinner.addClass('d-none');
        });
    } 
    // Fallback to legacy API
    else if (zidObj && zidObj.store && zidObj.store.cart && typeof zidObj.store.cart.removeCoupon === 'function') {
      zidObj.store.cart.removeCoupon()
        .then(function (response) {
          if (response.status === 'success') {
            window.location.reload();
          } else {
            if (typeof toastr !== 'undefined') toastr.error(response.data && response.data.message ? response.data.message : (window.i18n ? window.i18n.error : 'Error'));
          }
          $spinner.addClass('d-none');
        }).catch(function () {
          $spinner.addClass('d-none');
        });
    } else {
      $spinner.addClass('d-none');
      console.warn('Zid coupon API not found');
    }
  });
}


function goBack() {
    if (document.referrer && document.referrer.split('/')[2] === window.location.host) {
        history.go(-1);
        return false;
    } else {
        window.location.href = '/';
    }
}

function scrollToSubMenu(ele) {
    const subMenuElement = ele.querySelector('ul');
    if (subMenuElement) {
        const subMenu = document.getElementById("sliding-menu");
        subMenu.scrollTop = 0;
    }
}

class ProductsQuestions {
  constructor() {
    this.emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    this.customer = window.customer;
    this.customerName = $('#addProductQuestionModal input[name="name"]');
    this.customerEmail = $('#addProductQuestionModal input[name="email"]');
    this.customerQuestion = $('#addProductQuestionModal textarea[name="question"]');
    this.isAnonymous = $('#addProductQuestionModal input[name="is_anonymous"]');
    this.submitButton = $('.btn-submit-new-question');
  }

  isValidEmail() {
    return this.emailRegex.test(this.customerEmail.val());
  }

  showError(inputName) {
    $(`#addProductQuestionModal .input-error-${inputName}`).removeClass('d-none');
    $(`#addProductQuestionModal input[name="${inputName}"], textarea[name="${inputName}"]`).addClass('border-danger');
  }

  hideError(inputName) {
    $(`#addProductQuestionModal .input-error-${inputName}`).addClass('d-none');
    $(`#addProductQuestionModal input[name="${inputName}"], textarea[name="${inputName}"]`).removeClass('border-danger');
  }

  validateInputs() {
    let isValid = true;

    if (!this.customerQuestion.val().length) {
      this.showError('question');
      isValid = false;
    } else {
      this.hideError('question');
    }

    if (!this.customerEmail.val().length) {
      this.showError('email');
      isValid = false;
    } else {
      this.hideError('email');
    }

    if (this.customerEmail.val().length && !this.isValidEmail()) {
      $('#addProductQuestionModal .input-error-invalid-email').removeClass('d-none');
      $('#addProductQuestionModal input[name="email"]').addClass('border-danger');
      isValid = false;
    } else {
      $('#addProductQuestionModal .input-error-invalid-email').addClass('d-none');
    }

    if (!this.customerName.val().length) {
      this.showError('name');
      isValid = false;
    } else {
      this.hideError('name');
    }

    return isValid;
  }

  fillCustomerData() {
    if (this.customer && this.customer.name && this.customer.email) {
      if (!this.customerName.val()) this.customerName.val(this.customer.name);
      if (!this.customerEmail.val()) this.customerEmail.val(this.customer.email);
    }
  }

  checkAddQuestionPossibility() {
    $('#addQuestionButton').click(function () {
      var isAuth = (window.customerAuthState && window.customerAuthState.isAuthenticated) || window.customer;
      if (isAuth) {
        $('#addProductQuestionModal').modal('show');
        productsQuestions.fillCustomerData();
      } else {
        var currentPathname = location.pathname;
        var params = location.search || '';
        location.href = '/auth/login?redirect_to=' + encodeURIComponent(currentPathname + params);
      }
    });
  }

  async submitQuestion(productId) {
    const isValid = this.validateInputs();

    if (isValid) {
      $('.add-review-progress').removeClass('d-none');
      this.submitButton.attr('disabled', true);

      try {
        const response = await zid.store.product.addQuestion(
          productId,
          this.customerQuestion.val(),
          this.customerName.val(),
          this.customerEmail.val(),
          this.isAnonymous.is(':checked'),
        );

        if (response.status === 'success') {
          toastr.success(locales_messages.success, locales_messages.success_header);

          $('textarea[name="question"]').val('');
        }
      } catch (error) {
        console.log(error);
        toastr.error(error, locales_messages.error);
      } finally {
        $('.add-review-progress').addClass('d-none');

        $('#addProductQuestionModal').modal('hide');
        this.submitButton.removeAttr('disabled');
      }
    }
  }
}

const productsQuestions = new ProductsQuestions();
// new js
$(document).ready(function () {
  function countdown(element, targetDate) {
    var interval = setInterval(function () {
      var now = new Date().getTime();
      var distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        $(element).find(".days, .hours, .minutes, .seconds").text("0");
        $(element).hide();
        $(element).closest(".sale-end").hide();
        $(element).closest(".end-in-box").hide();
        return;
      }

      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      $(element).find(".days").text(days);
      $(element).find(".hours").text(hours);
      $(element).find(".minutes").text(minutes);
      $(element).find(".seconds").text(seconds);
    }, 1000);
  }

$(".tp-countdown").each(function () {
  var $this = $(this);
  var startStr = $this.attr("data-start");
  var endStr = $this.attr("data-end");

  var now = new Date().getTime();

  if (startStr && endStr) {
    var startDate = new Date(startStr).getTime();
    var endDate = new Date(endStr).getTime();

    if (!isNaN(startDate) && !isNaN(endDate)) {
      if (now >= startDate && now <= endDate) {
        $this.show();
        countdown(this, endDate);
      } else {
        $this.hide();
        $this.closest(".sale-end").hide();
        $this.closest(".end-in-box").hide();
      }
    } else {
      $this.hide();
    }
    return;
  }

  if (endStr && !startStr) {
    var endDate = new Date(endStr).getTime();
    if (!isNaN(endDate) && now <= endDate) {
      $this.show();
      countdown(this, endDate);
    } else {
      $this.hide();
      $this.closest(".sale-end").hide();
      $this.closest(".end-in-box").hide();
    }
    return;
  }

  console.warn("Countdown element has no valid date:", this);
  $this.hide();
});

});




$(document).ready(function () {
  $('.search-box').on('click', function() {
    $('body').toggleClass('open-search-modal');
    $('.overlay-search').toggleClass('active');
  });
  
  $('.overlay-search').on('click', function() {
    $('body').removeClass('open-search-modal');
    $('.overlay-search').removeClass('active');
  });
});

// $(document).ready(function() {
//   $('[data-action="back"]').each(function() {
//     $(this).attr('href', 'javascript:;');
//       $(this).contents().filter(function() {
//           return this.nodeType === Node.TEXT_NODE && $.trim(this.nodeValue) !== '';
//       }).wrap('<em></em>');

//       $(this).find('em').each(function() {
//           if ($(this).text().trim() === '') {
//               $(this).remove();
//           }
//       });
//   });
// });

// $(document).ready(function() {
//   var headerHeight = $('.header').outerHeight();
//   $('.header').css('height', headerHeight + 'px');
// });

// $(document).ready(function() {
//   $('.grid-btn').on('click', function() {
//     $(this).addClass('active');
//     $('.list-btn').removeClass('active');
//     $('#products-list').removeClass('list-view');
//   });

//   $('.list-btn').on('click', function() {
//     $(this).addClass('active');
//     $('.grid-btn').removeClass('active');
//     $('#products-list').addClass('list-view');
//   });
// });

$('[data-toggle]').each(function() {
  $(this).attr('data-bs-toggle', $(this).attr('data-toggle')).removeAttr('data-toggle');
});

$('[data-target]').each(function() {
  $(this).attr('data-bs-target', $(this).attr('data-target')).removeAttr('data-target');
});

document.addEventListener("DOMContentLoaded", function() {
    var menuLogo = document.getElementById("menu-logo");
    var menuSecondaryEl = document.getElementById("menu-secondary");
    if (!menuLogo || !menuSecondaryEl) return;
    var logoHTML = menuLogo.innerHTML;
    var menuSecondary = menuSecondaryEl.innerHTML;
    const htmlLang = document.documentElement.getAttribute("lang");
    const menuPosition = htmlLang === "ar" ? "right-front" : "left-front";
    const footerMenu1Items = Array.from(document.querySelectorAll("#footerMenu1 li"));
    const footerMenu2Items = Array.from(document.querySelectorAll("#footerMenu2 li"));
    const allFooterItems = [...footerMenu2Items];

    const listMenu = document.querySelector("#sliding-menu .list-menu");
    if (listMenu) {
        allFooterItems.forEach((li, index) => {
          const clone = li.cloneNode(true);
          clone.classList.add("from-footer");
          if (index === 0) {
              clone.classList.add("first-link");
          }
          listMenu.appendChild(clone);
      });
    }

    const menu = new Mmenu("#sliding-menu", {
        navbar: {
            title: "القائمة الرئيسية",
            titleLink: "parent"
        },
        navbars: [
            {
                position: "top",
                content: [
                    logoHTML,
                    "close"
                ]
            },
             {
                position: "bottom",
                content: [
                    menuSecondary
                ]
            }
        ],
        offCanvas: { position: menuPosition },
        theme: "white"
    });

    const api = menu.API;
    document.querySelector(".menu-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        api.open();
    });
});


$(document).on('click', '.links-bottom .language-currency-btn', function () {
    const $modal = $('#langCurrecyModal');
    if ($modal.length) {
        $('body').append($modal);
    }
});

function formatPrices(container = document) {
  const selectors = [
    ".product-formatted-price-old",
    ".product-formatted-price",
    ".new-price p",
    ".price-old",
    ".price-new",
    ".wafar",
    ".variant-price"
  ];

  function formatTextContent(node) {
    const original = node.textContent;

    const formatted = original.replace(/[\d,.]+/g, match => {
      const cleaned = match.replace(/,/g, '');
      const number = parseFloat(cleaned);

      if (Number.isNaN(number)) return match;

      return Number.isInteger(number) ? number.toLocaleString() : number.toLocaleString();
    });

    if (original !== formatted) {
      node.textContent = formatted;
    }
  }

  selectors.forEach(selector => {
    container.querySelectorAll(selector).forEach(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        formatTextContent(node);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  formatPrices();
});


document.addEventListener("DOMContentLoaded", function() {
  var progressIndicator = document.querySelector(".progress_indicator path");
  if (!progressIndicator) return;
  var pathLength = progressIndicator.getTotalLength();
  requestAnimationFrame(function() {
    progressIndicator.style.transition = "none";
    progressIndicator.style.strokeDasharray = pathLength + " " + pathLength;
    progressIndicator.style.strokeDashoffset = pathLength;
    progressIndicator.getBoundingClientRect();
    progressIndicator.style.transition = "stroke-dashoffset 10ms linear";
  });
  var updateProgress = function () {
    var scroll = window.scrollY;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    var progress = pathLength - (scroll * pathLength) / height;
    requestAnimationFrame(function() { progressIndicator.style.strokeDashoffset = progress; });
  };
  requestAnimationFrame(updateProgress);
  window.addEventListener("scroll", updateProgress, { passive: true });
  var offset = 250;
  var progressIndicatorEl = document.querySelector(".progress_indicator");
  var progressScrollTimeout;
  window.addEventListener("scroll", function () {
    if (progressScrollTimeout) return;
    progressScrollTimeout = requestAnimationFrame(function() {
      progressScrollTimeout = null;
      if (window.scrollY > offset) progressIndicatorEl.classList.add("active-progress");
      else progressIndicatorEl.classList.remove("active-progress");
    });
  }, { passive: true });
  if (progressIndicatorEl) progressIndicatorEl.addEventListener("click", function (event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return false;
  });
});