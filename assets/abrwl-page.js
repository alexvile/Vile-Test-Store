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
      const { title, price } = product;
      const card = document.createElement("li");
      card.innerHTML = `
      <div>
        ${title ? `<h3>${title}</h3>` : ""}
        ${price ? `<p>${price}</p>` : ""}
      </div>
    `;
      return card;
    }

    renderCards(data) {
      console.log(761, data);
      if (!data || !data.length) return;
      const container = document.createElement("ul");
      data.forEach((product) => {
        const card = this.renderCard(product);
        container.appendChild(card);
      });
      console.log(container);
      this.productsWrapperEl?.replaceChildren(container);
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
