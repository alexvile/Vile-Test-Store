(function () {
  //   indexedDB
  class Wishlist {
    constructor() {
      this.storageKey = "abrio_wl_items";
      this.cacheKey = "abrio_wl_cache";

      this.apiEndpoint = window.abrwl.root_url + "apps/wishlist";
      //   todo - token for guest to save after logged in
      //   this.guestToken = ...
      this.customerId = window.abrwl.customerId;
      this.isAuthenticated = !!this.customerId;

      this.isLoading = true;

      this.wishlist = [];
      this.products = [];
      this.init();
    }
    //  optimistic ui

    // overrite element (find and remove the same id)

    // resync items option !!!!!!!!!!!
    // check if all product are in db, if no - resynch - only for authenticated
    //  limit 1 wl for guest and 50 products

    async loadFirstPopulatedList() {
      if (!this.wishlist || !this.wishlist.length) return;

      const cachedProducts = JSON.parse(localStorage.getItem(this.cacheKey));
      const firstWLProducts = this.wishlist[0]?.product_ids;

      if (!firstWLProducts?.length) return;

      const cacheIsEmpty = !cachedProducts || !cachedProducts.length;

      const allElementsExist = cacheIsEmpty
        ? false
        : firstWLProducts.every((item) =>
            cachedProducts.some((element) => element.id === item)
          );

      if (this.isAuthenticated && (cacheIsEmpty || !allElementsExist)) {
        // await this.getWishlistApi();
        // fetch product via API and spread them
      } else {
        console.log("take from cache");
        // push
        this.products = cachedProducts || [];
      }
    }

    async loadWishlist() {
      const storedItems = JSON.parse(localStorage.getItem(this.storageKey));
      const shouldBeUpdated = !storedItems || storedItems.length === 0;

      if (this.isAuthenticated && shouldBeUpdated) {
        await this.getWishlistApi();
      } else {
        this.wishlist = storedItems || [];
      }
    }

    async getWishlistApi() {
      const data = await this.fetchWishlist();
      this.saveInLocalStorage(data);
      this.wishlist = data;
    }

    saveInLocalStorage(config) {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
    }

    // saveItems() {
    //   if (this.isAuthenticated) {
    //     this.syncWishlistWithAPI();
    //   } else {
    //     localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    //   }
    // }

    async addItem(productId) {
      if (!this.items.includes(productId)) {
        if (this.isAuthenticated) {
          try {
            await fetch(`${this.apiEndpoint}/add`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ productId }),
            });
          } catch (error) {
            console.error("Error adding item to API wishlist:", error);
          }
        }

        this.items.push(productId);
        this.saveItems();
        this.dispatchEvent("wishlist:add", { productId });
      }
    }

    async fetchWishlist() {
      try {
        const response = await fetch(`${this.apiEndpoint}`, {
          method: "GET",
          credentials: "same-origin",
        });
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          return data.items || [];
        } else {
          console.error("Failed to fetch wishlist from API");
          return [];
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        return [];
      }
    }

    async fetchListById(id) {
      if (!id) return;
      try {
        const response = await fetch(`${this.apiEndpoint}/list/${id}`, {
          method: "GET",
          credentials: "same-origin",
        });
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          return data.items || [];
        } else {
          console.error("Failed to fetch wishlist from API");
          return [];
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        return [];
      }
    }

    // async syncWishlistWithAPI() {
    //   try {
    //     await fetch(`${this.apiEndpoint}/sync`, {
    //       method: "POST",
    //       credentials: "include",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({ items: this.items }),
    //     });
    //   } catch (error) {
    //     console.error("Error syncing wishlist:", error);
    //   }
    // }

    async removeItem(productId) {
      this.items = this.items.filter((id) => id !== productId);
      this.saveItems();
      this.dispatchEvent("wishlist:remove", { productId });

      if (this.isAuthenticated) {
        try {
          await fetch(`${this.apiEndpoint}/remove`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId }),
          });
        } catch (error) {
          console.error("Error removing item from API wishlist:", error);
        }
      }
    }

    isInWishlist(productId) {
      if (!productId || !this.wishlist?.length) return;
      return this.wishlist.some((list) => list.product_ids.includes(productId));
    }

    dispatchEvent(eventName, detail = {}) {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    }

    async setupData() {
      // todo - check query params
      await this.loadWishlist();
      await this.loadFirstPopulatedList();
    }

    firstLoad() {
      // add loading state
      const allBtns = document.querySelectorAll("[abr-wl-button]");
      allBtns.forEach((node) => {
        const productId = node.getAttribute("data-product-id");
        if (this.isInWishlist(productId)) {
          node.classList.add("awl-is-added");
        }
      });
    }

    async init() {
      await this.setupData();
      //   this.observeDOM();
      //   or
      this.firstLoad();
      this.attachListeners();
    }

    attachListeners() {
      document.body.addEventListener("click", (e) => {
        const button = e.target.closest("[abr-wl-button]");
        if (button) {
          const productId = button.getAttribute("data-product-id");
          console.log(111, productId);
          if (this.isInWishlist(productId)) {
            this.removeItem(productId);
            button.classList.remove("awl-is-added");
          } else {
            this.addItem(productId);
            button.classList.add("awl-is-added");
          }
        }
      });
    }

    observeDOM() {
      const observer = new MutationObserver((mutations) => {
        let debounceTimeout;
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          mutations.forEach((mutation) => {
            for (const node of mutation.addedNodes) {
              console.log("node added");
              if (node.matches?.("[abr-wl-button]")) {
                console.log(1111331, node);
                const productId = node.getAttribute("data-product-id");
                if (this.isInWishlist(productId)) {
                  node.classList.add("awl-is-added");
                }
              }
            }
          });
        }, 100);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.updateButtons();
    }

    updateButtons() {
      const buttons = document.querySelectorAll("[abr-wl-button]");
      buttons.forEach((button) => {
        const productId = button.getAttribute("data-product-id");
        if (this.isInWishlist(productId)) {
          button.classList.add("awl-is-added");
        } else {
          button.classList.remove("awl-is-added");
        }
      });
    }
  }

  const abrio_wishlist = new Wishlist();
  window.wl = abrio_wishlist;
})();

//   const mockWL = [
//     {
//       title: "Main",
//       id: "MTczNzQ2ODE5MjI0NQ",
//       product_ids: ["8571553939705"],
//     },
//   ];
//  localStorage.setItem('abrio_wl_items', JSON.stringify(mockWL));

//   const mockPr = [
//     {
//       id: "8571553939705",
//       title: "TIMBERLAND | MENS 6 INCH PREMIUM BOOT",
//       handle: "timberland-mens-6-inch-premium-boot",
//     },
//   ];
//   localStorage.setItem('abrio_wl_cache', JSON.stringify(mockPr));
