let page = 1;
let isLoading = false;
let categoryId = null;

function initialize() {
  const url = window.location.href;
  if (url.includes("/categories/")) {
    const parts = url.split("/categories/");
    if (parts.length > 1) {
      categoryId = parts[1].split("/")[0];
    }
  }
}

let isCustomerLoggedIn = false;

const waitForCustomerFetched = new Promise((resolve) => {
  document.addEventListener("zid-customer-fetched", function (event) {
    const customer = event.detail.customer;
    isCustomerLoggedIn = !!customer;
    resolve();
  });
});

function createProductCard(product) {
  const isOutOfStock = product.is_infinite === false && product.quantity <= 0;
  
  // بناء صورة المنتج
  const productImage = product.images && product.images.length
    ? product.images[0]["image"]["large"]
    : window.asset_url + "product-img.svg";

  let userLang = document.documentElement.lang || "ar";

  // بناء الـ Badge
  let badgeHTML = "";
  if (product.badge && product.badge.body) {
    let text = "";
    if (userLang.startsWith("ar")) {
      text = product.badge.body.ar || product.badge.body.en || "";
    } else {
      text = product.badge.body.en || product.badge.body.ar || "";
    }
    badgeHTML = `<span class="badge-name" data-badge-name-product-id="${product.id}"><span>${text}</span></span>`;
  }

  // بناء الخصم
  let discountHTML = "";
  if (product.sale_price && product.sale_price < product.price) {
    let discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
    discountHTML = `<span class="discount">- ${discount}%</span>`;
  }

  // رسالة نفاذ الكمية
  let outOfStockHTML = "";
  if (isOutOfStock) {
    outOfStockHTML = `<small class="out-of-stock">${window.i18n.lbl_error_product_out_of_stock}</small>`;
  }

  // بناء الأسعار
  let priceHTML = "";
  if (product.sale_price && product.sale_price < product.price) {
    priceHTML = `
      <div class="tp-price-product">
        <p class="price-new">${product.formatted_sale_price}</p>
        <div class="price-wafar">
          <span class="price-old">${product.formatted_price}</span>
        </div>
      </div>`;
  } else {
    priceHTML = `
      <div class="tp-price-product">
        <p class="price-new">${product.formatted_price}</p>
      </div>`;
  }

  // رسالة عدم الخضوع للضريبة
  let notTaxableHTML = "";
  if ((product.is_infinite || product.quantity > 0) && !product.is_taxable) {
    notTaxableHTML = `<small class="is-not-taxable">${window.i18n.product_is_not_taxable}</small>`;
  }

  // بناء أزرار الإجراءات
  let actionBtn = "";
  if (isOutOfStock) {
    actionBtn = `
      <a class="btn-product-card-out-of-stock" disabled>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.30887 6.75001C7.66846 4.48301 9.63185 2.75 12 2.75C14.3682 2.75 16.3315 4.48301 16.6911 6.75L7.30887 6.75001ZM5.79454 6.75001C6.16505 3.65183 8.80204 1.25 12 1.25C15.198 1.25 17.8349 3.65183 18.2055 6.75L19.4646 6.75H19.4646C19.9568 6.74994 20.4052 6.74989 20.7642 6.80237C21.1588 6.86006 21.5792 6.99805 21.8925 7.38056C22.2023 7.75888 22.2601 8.19716 22.2487 8.59566C22.2381 8.96381 22.1625 9.41437 22.0784 9.9159L21.7082 12.124C21.6397 12.5325 21.2531 12.8082 20.8445 12.7397C20.436 12.6712 20.1604 12.2845 20.2289 11.876L20.591 9.71583C20.6857 9.15105 20.742 8.80447 20.7493 8.5526C20.7526 8.43547 20.7434 8.37446 20.7362 8.34587C20.7346 8.33942 20.7332 8.33514 20.7323 8.33265L20.728 8.33053C20.7076 8.3211 20.6563 8.30255 20.5472 8.28659C20.3099 8.25191 19.9735 8.25001 19.4144 8.25001L4.58563 8.25001C4.02651 8.25001 3.69004 8.25191 3.4528 8.28659C3.34365 8.30255 3.29237 8.3211 3.27203 8.33053L3.26767 8.33265C3.26677 8.33514 3.26538 8.33941 3.26376 8.34587C3.25658 8.37445 3.24735 8.43547 3.25071 8.5526C3.25795 8.80447 3.31432 9.15105 3.409 9.71583L4.61257 16.8954C4.81513 18.1038 4.95715 18.9432 5.14282 19.5725C5.32307 20.1836 5.52009 20.5053 5.77674 20.7276C6.03112 20.948 6.36621 21.0901 6.97393 21.1679C7.60407 21.2486 8.42816 21.25 9.62181 21.25H11.5C11.9142 21.25 12.25 21.5858 12.25 22C12.25 22.4142 11.9142 22.75 11.5 22.75H9.57149C8.44034 22.75 7.51991 22.75 6.78342 22.6557C6.01361 22.5572 5.35455 22.3465 4.79455 21.8613C4.23682 21.3781 3.92692 20.7522 3.70412 19.997C3.48969 19.2701 3.33385 18.3404 3.1412 17.1911L1.92964 9.96382L1.92161 9.91593C1.83748 9.41439 1.76191 8.96382 1.75133 8.59566C1.73988 8.19716 1.79764 7.75888 2.10749 7.38055C2.42076 6.99805 2.84115 6.86006 3.23581 6.80237C3.59476 6.74989 4.04321 6.74994 4.53542 6.75H4.53543L4.58563 6.75001L5.79454 6.75001ZM22.0303 14.4697C22.3232 14.7626 22.3232 15.2374 22.0303 15.5303L19.0607 18.5L22.0303 21.4697C22.3232 21.7626 22.3232 22.2374 22.0303 22.5303C21.7374 22.8232 21.2626 22.8232 20.9697 22.5303L18 19.5607L15.0303 22.5303C14.7374 22.8232 14.2626 22.8232 13.9697 22.5303C13.6768 22.2374 13.6768 21.7626 13.9697 21.4697L16.9393 18.5L13.9697 15.5303C13.6768 15.2374 13.6768 14.7626 13.9697 14.4697C14.2626 14.1768 14.7374 14.1768 15.0303 14.4697L18 17.4393L20.9697 14.4697C21.2626 14.1768 21.7374 14.1768 22.0303 14.4697Z" fill="currentColor"/>
        </svg>
      </a>`;
  } else if (product.has_options || product.has_fields) {
    actionBtn = `
      <a class="btn-product-card-select-variant" href="/products/${product.slug}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.30887 6.75001C7.66846 4.48301 9.63185 2.75 12 2.75C14.3682 2.75 16.3315 4.48301 16.6911 6.75L7.30887 6.75001ZM5.79454 6.75001C6.16505 3.65183 8.80204 1.25 12 1.25C15.198 1.25 17.8349 3.65183 18.2055 6.75L19.4646 6.75H19.4646C19.9568 6.74994 20.4052 6.74989 20.7642 6.80237C21.1588 6.86006 21.5792 6.99805 21.8925 7.38056C22.2023 7.75888 22.2601 8.19716 22.2487 8.59566C22.2381 8.96381 22.1625 9.41437 22.0784 9.9159L21.792 11.624C21.7236 12.0325 21.3369 12.3082 20.9284 12.2397C20.5198 12.1712 20.2442 11.7845 20.3127 11.376L20.591 9.71583C20.6857 9.15105 20.742 8.80447 20.7493 8.5526C20.7526 8.43547 20.7434 8.37446 20.7362 8.34587C20.7346 8.33942 20.7332 8.33514 20.7323 8.33265L20.728 8.33053C20.7076 8.3211 20.6563 8.30255 20.5472 8.28659C20.3099 8.25191 19.9735 8.25001 19.4144 8.25001H4.58563C4.02651 8.25001 3.69004 8.25191 3.4528 8.28659C3.34365 8.30255 3.29237 8.3211 3.27203 8.33053L3.26767 8.33265C3.26677 8.33514 3.26538 8.33941 3.26376 8.34587C3.25658 8.37445 3.24735 8.43547 3.25071 8.5526C3.25795 8.80447 3.31432 9.15105 3.409 9.71583L4.61257 16.8954C4.81513 18.1038 4.95715 18.9432 5.14282 19.5725C5.32307 20.1836 5.52009 20.5053 5.77674 20.7276C6.03112 20.948 6.36621 21.0901 6.97393 21.1679C7.60407 21.2486 8.42816 21.25 9.62181 21.25H12C12.4142 21.25 12.75 21.5858 12.75 22C12.75 22.4142 12.4142 22.75 12 22.75H9.57149C8.44034 22.75 7.51991 22.75 6.78342 22.6557C6.01361 22.5572 5.35455 22.3465 4.79455 21.8613C4.23682 21.3781 3.92692 20.7522 3.70412 19.997C3.48969 19.2701 3.33385 18.3404 3.1412 17.1911L1.92964 9.96382L1.92161 9.91593C1.83748 9.41439 1.76191 8.96382 1.75133 8.59566C1.73988 8.19716 1.79764 7.75888 2.10749 7.38055C2.42076 6.99805 2.84115 6.86006 3.23581 6.80237C3.59476 6.74989 4.04321 6.74994 4.53542 6.75H4.53543L4.58563 6.75001L5.79454 6.75001ZM18 13.25C18.4142 13.25 18.75 13.5858 18.75 14V17.25H22C22.4142 17.25 22.75 17.5858 22.75 18C22.75 18.4142 22.4142 18.75 22 18.75H18.75V22C18.75 22.4142 18.4142 22.75 18 22.75C17.5858 22.75 17.25 22.4142 17.25 22V18.75H14C13.5858 18.75 13.25 18.4142 13.25 18C13.25 17.5858 13.5858 17.25 14 17.25H17.25V14C17.25 13.5858 17.5858 13.25 18 13.25Z" fill="currentColor"/>
        </svg>
      </a>`;
  } else {
    actionBtn = `
      <button type="button" class="product-card-add-to-cart" onclick="productCartAddToCart(this,'${product.id}')" aria-label="AddToCart">
        <img loading="lazy" style="display: inline" class="add-to-cart-progress d-none" src="${window.asset_url}spinner.gif" width="20" height="20"/>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.30887 6.75001C7.66846 4.48301 9.63185 2.75 12 2.75C14.3682 2.75 16.3315 4.48301 16.6911 6.75L7.30887 6.75001ZM5.79454 6.75001C6.16505 3.65183 8.80204 1.25 12 1.25C15.198 1.25 17.8349 3.65183 18.2055 6.75L19.4646 6.75H19.4646C19.9568 6.74994 20.4052 6.74989 20.7642 6.80237C21.1588 6.86006 21.5792 6.99805 21.8925 7.38056C22.2023 7.75888 22.2601 8.19716 22.2487 8.59566C22.2381 8.96381 22.1625 9.41437 22.0784 9.9159L20.8588 17.191L20.8588 17.1911C20.6661 18.3404 20.5103 19.2701 20.2959 19.997C20.0731 20.7522 19.7632 21.3781 19.2054 21.8613C18.6454 22.3465 17.9864 22.5572 17.2166 22.6557C16.4801 22.75 15.5596 22.75 14.4285 22.75H9.57149C8.44034 22.75 7.51991 22.75 6.78342 22.6557C6.01361 22.5572 5.35455 22.3465 4.79455 21.8613C4.23682 21.3781 3.92692 20.7522 3.70412 19.997C3.48969 19.2701 3.33385 18.3404 3.1412 17.1911L1.92964 9.96382L1.92161 9.91593C1.83748 9.41439 1.76191 8.96382 1.75133 8.59566C1.73988 8.19716 1.79764 7.75888 2.10749 7.38055C2.42076 6.99805 2.84115 6.86006 3.23581 6.80237C3.59476 6.74989 4.04321 6.74994 4.53542 6.75H4.53543L4.58563 6.75001L5.79454 6.75001ZM3.26376 8.34587C3.26538 8.33941 3.26677 8.33514 3.26767 8.33265L3.27203 8.33053C3.29237 8.3211 3.34365 8.30255 3.4528 8.28659C3.69004 8.25191 4.02651 8.25001 4.58563 8.25001L19.4144 8.25001C19.9735 8.25001 20.3099 8.25191 20.5472 8.28659C20.6563 8.30255 20.7076 8.3211 20.728 8.33053L20.7323 8.33265C20.7332 8.33514 20.7346 8.33942 20.7362 8.34587C20.7434 8.37446 20.7526 8.43547 20.7493 8.5526C20.742 8.80447 20.6857 9.15105 20.591 9.71583L19.3874 16.8954C19.1849 18.1038 19.0428 18.9432 18.8572 19.5725C18.6769 20.1836 18.4799 20.5053 18.2232 20.7276C17.9689 20.948 17.6338 21.0901 17.0261 21.1679C16.3959 21.2486 15.5718 21.25 14.3782 21.25H9.62181C8.42816 21.25 7.60407 21.2486 6.97393 21.1679C6.36621 21.0901 6.03112 20.948 5.77674 20.7276C5.52009 20.5053 5.32307 20.1836 5.14282 19.5725C4.95715 18.9432 4.81513 18.1038 4.61257 16.8954L3.409 9.71583C3.31432 9.15105 3.25795 8.80447 3.25071 8.5526C3.24735 8.43547 3.25658 8.37445 3.26376 8.34587Z" fill="currentColor"/>
        </svg>
      </button>`;
  }

  // عرض الـ product-features من الـ metafields
let featuresHTML = "";
if (product.metafields && product.metafields.length) {
  const feature = product.metafields.find(m => m.slug === "product-features");
  if (feature && feature.value) {
    const lang = document.documentElement.lang || "ar";
    if (lang.startsWith("en") && feature.value.en) {
      featuresHTML = `<div class="product-card-features">${feature.value.en}</div>`;
    } else if (feature.value.ar) {
      featuresHTML = `<div class="product-card-features">${feature.value.ar}</div>`;
    }
  }
}

  // عرض version-number كصورة
  let versionNumberHTML = "";
  if (product.metafields && product.metafields.length) {
    const version = product.metafields.find(m => m.slug === "version-number");
    if (version && version.value && version.value.full_size) {
      versionNumberHTML = `
        <div class="version-number">
          <img src="${version.value.full_size}" alt="version-number">
        </div>`;
    }
  }

  const isPreOrder = Array.isArray(window.preOrderList) && window.preOrderList.some(item => item.product && item.product.id === product.id);
  const preOrderLabel = (window.locals && window.locals.pre_order) || "Pre Order";
  const preOrderBadge = isPreOrder ? `<span class="pre-order-badge">${preOrderLabel}</span>` : "";

  // بناء HTML الكامل للكارد
  const productHTML = `
    <div class="card-product-style-2 product-box ${isOutOfStock ? "product-item-out-of-stock" : ""}" product-id="${product.id}">
      <div class="tp-product-container">
        <div class="img-and-btns">
          <a href="/products/${product.slug}" class="tp-image-product">
            <div class="box-img-product">
              <img loading="lazy" class="lazy-img" width="200" height="300" 
                   id="product-card-img-${product.id}-1" 
                   src="${productImage}" 
                   alt="${product.name}">
            </div>
            <div class="product-card-badges">
              ${badgeHTML}
              <span class="product-card-bundle-offer" data-bundle-offer-product-id="${product.id}"></span>
              ${preOrderBadge}
            </div>
            ${discountHTML}
            ${outOfStockHTML}
            ${versionNumberHTML}
          </a>
        </div>
        <div class="tp-content-wrapper">
          <a href="/products/${product.slug}" class="tp-content-product">
            <h2>${product.name}</h2>
          </a>
          ${featuresHTML}
          <div class="price-cart-btns">
            <div class="price-part">
              ${priceHTML}
              ${notTaxableHTML}
            </div>
            <div class="footer-btns">
              ${actionBtn}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const productElement = document.createElement("div");
  productElement.innerHTML = productHTML;
  return productElement.firstElementChild;
}

// تفعيل تحميل الصور التي تستخدم data-src (للبطاقات المضافة من HTML أو التي تحتوي data-src)
function applyLazySrcToImages(container) {
  if (!container || !container.querySelector) return;
  var imgs = container.querySelectorAll("img.lazy-img[data-src], img[data-src]");
  imgs.forEach(function (img) {
    var src = img.getAttribute("data-src");
    if (src) {
      img.src = src;
      img.removeAttribute("data-src");
    }
  });
}

async function loadMoreProducts(lastPage) {
  if (isLoading || page >= lastPage) return;
  isLoading = true;

  const btn = document.getElementById("load-more-button");
  btn.classList.add("opacity-35", "cursor-not-allowed");
  btn.disabled = true;

  try {
    const nextPage = page + 1;
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);
    searchParams.set("page", nextPage);

    const response = await fetch(`${url.pathname}?${searchParams.toString()}`);
    if (!response.ok) throw new Error("HTTP " + response.status);

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const productElements = doc.querySelectorAll(".product-box");

    if (productElements.length > 0) {
      page = nextPage;
      const productsWrapper = document.getElementById("products-list");
      const newItems = [];

      for (const el of productElements) {
        const productId =
          el.getAttribute("product-id") ||
          (el.querySelector("[data-bundle-offer-product-id]") && el.querySelector("[data-bundle-offer-product-id]").getAttribute("data-bundle-offer-product-id"));

        if (productId && window.zid && window.zid.products && typeof window.zid.products.get === "function") {
          try {
            const res = await window.zid.products.get(productId);
            if (res && res.data && res.data.product) {
              const card = createProductCard(res.data.product);
              var wrap = document.createElement("div");
              wrap.appendChild(card);
              newItems.push(wrap);
              continue;
            }
          } catch (err) {
            console.warn("Could not fetch product " + productId + ", using HTML");
          }
        }

        var toClone = el;
        if (el.parentNode && el.parentNode.id !== "products-list") {
          toClone = el.parentNode;
        }
        var clone = toClone.cloneNode(true);
        newItems.push(clone);
      }

      newItems.forEach(function (item) {
        productsWrapper.appendChild(item);
        applyLazySrcToImages(item);
      });
      if (typeof formatPrices === "function") {
        newItems.forEach(function (item) {
          formatPrices(item);
        });
      }

      if (page >= lastPage) {
        btn.style.display = "none";
      }
    } else {
      page = nextPage;
      if (page >= lastPage && btn) btn.style.display = "none";
    }
  } catch (e) {
    console.error(e);
  }

  isLoading = false;
  if (btn) {
    btn.classList.remove("opacity-35", "cursor-not-allowed");
    btn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initialize();

  await waitForCustomerFetched;

  // ➋ الكود الخاص بالتحميل التلقائي عند الوصول إلى الفوتر (محكوم من layout عبر window.enableAutoLoadMore)
  const btn = document.getElementById("load-more-button");
  const footer = document.querySelector(".footer");

  if (!btn || parseInt(btn.dataset.pages) <= 1) {
    if (btn) btn.style.display = "none";
    return;
  }

  const lastPage = parseInt(btn.dataset.pages);
  
  // ➊ تفعيل التحميل عند الضغط على زر "تحميل المزيد"
  btn.addEventListener("click", () => {
    if (!isLoading) {
      const loader = btn.querySelector('.btn-loader');
      if (loader) {
        loader.classList.remove('d-none');
      }
      loadMoreProducts(lastPage).finally(() => {
        if (loader) {
          loader.classList.add('d-none');
        }
      });
    }
  });

  if (window.enableAutoLoadMore && footer) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading) {
            loadMoreProducts(lastPage);
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
      }
    );
    observer.observe(footer);
  }
});


async function fetchAllProducts(categoryId = null) {
  let allProducts = [];
  let currentPage = 1;
  let lastPage = 1;

  try {
    do {
      const response = await zid.store.product.fetchAll(categoryId || "", {
        page: currentPage,
      });

      if (response.status === "success") {
        const products = response.data.products.data;
        lastPage = response.data.products.last_page;

        allProducts = allProducts.concat(products);
        currentPage++;
      } else {
        console.error("فشل في جلب المنتجات في الصفحة", currentPage);
        break;
      }
    } while (currentPage <= lastPage);

    return allProducts;
  } catch (e) {
    console.error("❌ حصل خطأ أثناء تحميل كل المنتجات:", e);
    return [];
  }
}
