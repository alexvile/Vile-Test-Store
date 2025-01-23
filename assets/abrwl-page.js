(function () {
  class WishlistPage {
    constructor() {
      this.storageKey = "abrio_wl_data";
      this.cacheKey = "abrio_wl_cache";
      this.listsContainerEl = document.getElementById("abrwl-lists-nav");
      this.lists = [];
      this.products = [];
      this.apiEndpoint = "";
      this.init();
    }

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

    // check if it is a wishlist page!!!

    updateCache(data) {
      if (!data) return;
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
      // todo - make a getter and WATCH for the count and wishlist
      this.products = data;
    }

    async loadListById(id) {
      const cachedProducts = JSON.parse(localStorage.getItem(this.cacheKey));
      console.log(cachedProducts);
      const neededList = this.lists.find((el) => id === el.id);
      if (!neededList || !neededList.product_ids.length) return;
      const cacheIsEmpty = !cachedProducts || !cachedProducts.length;
      const allElementsExist = cacheIsEmpty
        ? false
        : neededList.product_ids.every((item) =>
            // cachedProducts.some((element) => element.id === item)
            // todo -refactor
            cachedProducts.some((element) => element.id.includes(item))
          );
      console.log(111, allElementsExist);

      if (this.isAuthenticated && (cacheIsEmpty || !allElementsExist)) {
        // fetch product via API and spread them
        const { success, data } = await this.fetchListByIdAPI(id);
        if (success) {
          // todo update only for unique items
          this.updateCache(data);
        }
      } else {
        console.log("take from cache");
        // push
        // or use fetch
        this.products = cachedProducts || [];
      }
    }

    // async loadFirstPopulatedList() {
    //   if (!this.wishlist || !this.wishlist.length) return;

    //   const cachedProducts = JSON.parse(localStorage.getItem(this.cacheKey));
    //   const firstWLProducts = this.wishlist[0]?.product_ids;

    //   if (!firstWLProducts?.length) return;

    //   const cacheIsEmpty = !cachedProducts || !cachedProducts.length;

    //   const allElementsExist = cacheIsEmpty
    //     ? false
    //     : firstWLProducts.every((item) =>
    //         cachedProducts.some((element) => element.id === item)
    //       );

    //   if (this.isAuthenticated && (cacheIsEmpty || !allElementsExist)) {
    //     // fetch product via API and spread them
    //   } else {
    //     console.log("take from cache");
    //     // push
    //     // or use fetch
    //     this.products = cachedProducts || [];
    //   }
    // }

    async clickByButton(e) {
      const button = e.currentTarget;
      const id = button?.dataset.id;
      if (!id) return;

      await this.loadListById(id);
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
      });
      this.listsContainerEl?.appendChild(container);
    }

    start() {
      // todo - refactor
      this.lists = window.wl.wishlist;
      this.apiEndpoint = window.wl.apiEndpoint;
      this.isAuthenticated = window.wl.isAuthenticated;
      this.renderButtons();
    }

    init() {
      document.addEventListener("abrwl:initialized", (event) => {
        // console.log(event);
        this.start();
      });
    }
  }

  const mm = new WishlistPage();
  window.wp = mm;
})();
