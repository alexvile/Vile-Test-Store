(function () {
  class WishlistPage {
    constructor() {
      this.storageKey = "abrio_wl_data";
      this.cacheKey = "abrio_wl_cache";
      this.listsContainerEl = document.getElementById("abrwl-lists-nav");
      this.productsWrapperEl = document.getElementById("abrwl-products");
      this.lists = [];
      this.products = [];
      this.apiEndpoint = "";
      this.listButtonsEl = [];
      this.init();
    }
    // todo - add remove option using wl-main js !

    // check if it is a wishlist page!!!

    /* *** Remote API services *** */
    async fetchListByIdAPI(id) {
      if (!id) return;
      try {
        const response = await fetch(`${this.apiEndpoint}/list/${id}`, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            "ngrok-skip-browser-warning": "true"
          }
        });
        if (response.ok) {
          const { data } = await response.json();
          return { success: true, data: data };
        } else {
          console.error("Failed to fetch wishlist from API");
          return { success: false, data: [] };
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        return { success: false, data: [] };
      }
    }

    updateArray(newArray) {
      const existingArray = [...this.products];
      newArray.forEach((newItem) => {
        const index = existingArray.findIndex((item) => item.id === newItem.id);
        if (index !== -1) {
          existingArray[index] = newItem;
        } else {
          existingArray.push(newItem);
        }
      });
      return existingArray;
    }

    updateCache(data) {
      if (!data) return;
      // todo - make a getter and WATCH for the count and wishlist
      const updatedArray = this.updateArray(data);
      localStorage.setItem(this.cacheKey, JSON.stringify(updatedArray));
      this.products = updatedArray;
    }

    async loadListById(id) {
      const cachedProducts = JSON.parse(localStorage.getItem(this.cacheKey));
      console.log("cachedProducts", cachedProducts);
      const neededList = this.lists.find((el) => id === el.id);
      if (!neededList || !neededList.product_ids.length) return;
      const cacheIsEmpty = !cachedProducts || !cachedProducts.length;
      const allElementsExist = cacheIsEmpty
        ? false
        : neededList.product_ids.every((item) =>
            cachedProducts.some((element) => element.id === item)
          );

      if (this.isAuthenticated && (cacheIsEmpty || !allElementsExist)) {
        console.log("use fetch");
        const { success, data } = await this.fetchListByIdAPI(id);
        if (success) {
          this.updateCache(data);
        }
      } else {
        console.log("take from cache");
        // push
        // or use fetch ???
        this.products = cachedProducts || [];
      }
    }

    getElementsOfSelectedList(id) {
      const neededList = this.lists.find((el) => el.id === id);
      if (!neededList?.product_ids?.length) return;
      const { product_ids: neededElements } = neededList;
      return this.products.filter((item) => neededElements.includes(item.id));
    }

    async clickByButton(e) {
      // todo - prevent click if current list is selected !!!!!!
      // todo add lcasslist - active
      const button = e.currentTarget;
      const id = button?.dataset.id;
      if (!id) return;

      await this.loadListById(id);
      const products = this.getElementsOfSelectedList(id);
      this.renderCards(products);
    }
    renderCard(product) {
      const { title, featuredMedia, variants, id, url } = product;
      const image = featuredMedia?.preview?.image?.url;
      const card = document.createElement("li");
      card.classList.add("wishlist__grid-item");
      //   card.innerHTML = `
      //   <div>
      //     ${title ? `<h3>${title}</h3>` : ""}
      //     ${price ? `<p>${price}</p>` : ""}
      //   </div>
      // `;
      card.innerHTML = `
          <button type="button"
            class="abr-wl-button awl-is-added"
            abr-wl-button
            data-product-id="${id}">
            <svg class="icon heart" width="44px" height="44px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22.59l-9.2-9.12C.43 11.09.43 7.21 2.8 4.83a6.03 6.03 0 0 1 4.29-1.79c1.62 0 3.14.63 4.29 1.79l.62.62.62-.62a6.014 6.014 0 0 1 4.29-1.79c1.62 0 3.14.63 4.29 1.79 2.37 2.38 2.37 6.26 0 8.64L12 22.59zM7.09 4c-1.37 0-2.65.54-3.61 1.51-2 2.01-2 5.28 0 7.29L12 21.25l8.53-8.45c2-2.01 2-5.28 0-7.29A5.079 5.079 0 0 0 16.92 4c-1.37 0-2.65.54-3.61 1.51l-1.3 1.3-1.3-1.3C9.75 4.54 8.46 4.01 7.1 4z"/><path fill="none" d="M0 0h24v24H0z"/></svg>
            <svg class="icon heart-filled" width="44px" height="44px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22.59l-9.2-9.12C.43 11.09.43 7.21 2.8 4.83a6.03 6.03 0 0 1 4.29-1.79c1.62 0 3.14.63 4.29 1.79l.62.62.62-.62a6.014 6.014 0 0 1 4.29-1.79c1.62 0 3.14.63 4.29 1.79 2.37 2.38 2.37 6.26 0 8.64L12 22.59z"/><path fill="none" d="M0 0h24v24H0z"/></svg>
          </button>
            <div class="wishlist__image-wrapper">
              <img width="auto" height="auto" src="${image}">
            </div>
            <div>
              <a href="${url}" class="full-unstyled-link">
                ${title}
              </a>
            </div>
            <div class="wishlist__item-price-wrapper">
              <p>$${variants.nodes[0].price}</p>
            </div>
        `;
      console.log(card);
      return card;
    }

    renderCards(data) {
      console.log(761, data);
      if (!data || !data.length) return;
      const fragment = document.createDocumentFragment();
      data.forEach((product) => {
        const card = this.renderCard(product);
        fragment.appendChild(card);
      });
      console.log(fragment);
      this.productsWrapperEl?.replaceChildren(fragment);
    }

    renderButtons() {
      console.log("render lists");
      // todo - add watcher
      // todo - refactor this !!!!!!

      if (!this.lists || !this.lists.length) return;
      const container = document.createElement("div");
      this.lists.forEach((list) => {
        const button = document.createElement("button");
        // todo - refactor
        button.addEventListener("click", this.clickByButton.bind(this));
        button.textContent = list.title;
        button.dataset.id = list.id;
        container.appendChild(button);
        this.listButtonsEl.push(button);
      });
      this.listsContainerEl?.appendChild(container);
    }

    start() {
      // todo - refactor
      this.lists = window.wl.wishlist;
      this.apiEndpoint = window.wl.apiEndpoint;
      this.isAuthenticated = window.wl.isAuthenticated;
      this.renderButtons();
      // click to the first element to show first list
      this.listButtonsEl[0]?.click();
    }

    init() {
      document.addEventListener("abrwl:initialized", (event) => {
        // console.log(event);
        this.start();
        // this.rtender
      });
    }
  }

  const mm = new WishlistPage();
  window.wp = mm;
})();
