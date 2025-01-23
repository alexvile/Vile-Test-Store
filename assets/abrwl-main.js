(function () {
  //   indexedDB

  class Wishlist {
    constructor() {
      this.storageKey = "abrio_wl_data";
      this.cacheKey = "abrio_wl_cache";

      this.apiEndpoint = window.abrwl.root_url + "apps/wishlist";
      //   todo - token for guest to save after logged in
      //   this.guestToken = ...
      this.customerId = window.abrwl.customerId;
      this.isAuthenticated = !!this.customerId;

      this.isLoading = true;
      this.countEl = document.querySelector("[abr-wl-count]");

      this.count = 0;
      this.wishlist = [];
      this.products = [];
      this.init();
    }

    // use frontend to fecth or backend to fetch ??????

    //  1 product only in 1 wishlist

    //  optimistic ui

    // overrite element (find and remove the same id)

    // resync items option !!!!!!!!!!!

    // check if all product are in db, if no - resynch - only for authenticated
    // limit 1 wl for guest and 50 products

    // calculateTotal() {

    // }

    // todo - add loading

    /* *** Remote API services *** */

    async fetchWislistAPI() {
      try {
        const response = await fetch(`${this.apiEndpoint}`, {
          method: "GET",
          credentials: "same-origin",
        });
        if (response.ok) {
          const data = await response.json();
          return data || { wishlist: [], count: 0 };
          // todo - remove default values?
        } else {
          console.error("Failed to fetch wishlist from API");
          return { wishlist: [], count: 0 };
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        return { wishlist: [], count: 0 };
      }
    }

    async addProductAPI(productId, listId) {
      try {
        const response = await fetch(
          `${this.apiEndpoint}/product/${productId}`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ listId }),
          }
        );
        if (response.ok) {
          const json = await response.json();
          console.log("Successfull added");
          return { success: true, data: json };
        } else {
          console.error("Failed to add to remote wishlist");
          return { success: false, data: null };
        }
      } catch (error) {
        console.error("Error adding item to API wishlist:", error);
        return { success: false, data: null };
      } finally {
        // console.log('stop loading')
      }
    }

    async removeProductAPI(productId) {
      try {
        const response = await fetch(
          `${this.apiEndpoint}/product/${productId}`,
          {
            method: "DELETE",
            credentials: "same-origin",
          }
        );
        if (response.ok) {
          const json = await response.json();
          console.log("Successfull deleted");
          return { success: true, data: json };
        } else {
          // todo - unchecl button - optimistic UI
          console.error("Failed to remove to remote wishlist");
          return { success: false, data: null };
        }
      } catch (error) {
        console.error("Error removing item to API wishlist:", error);
        return { success: false, data: null };
      } finally {
        // console.log('stop loading')
      }
    }

    updateWishlist(data) {
      if (!data) return;
      const { count, wishlist } = data;
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // todo - make a getter and WATCH for the count and wishlist
      this.updateCount(count);
      this.count = count;
      this.wishlist = wishlist;
    }

    async getRemoteWishlist() {
      const data = await this.fetchWislistAPI();
      console.log(data);
      if (!data) return;
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.wishlist = data.wishlist;
      this.count = data.count;
    }

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
        // fetch product via API and spread them
      } else {
        console.log("take from cache");
        // push
        // or use fetch
        this.products = cachedProducts || [];
      }
    }

    async loadWishlist() {
      const storedItems =
        JSON.parse(localStorage.getItem(this.storageKey)) || {};
      const { wishlist = [], count = 0 } = storedItems;

      const shouldBeUpdated = this.isAuthenticated && !count;

      if (shouldBeUpdated) {
        await this.getRemoteWishlist();
      } else {
        this.wishlist = wishlist;
        this.count = count;
      }
    }

    async addItem(productId, listID) {
      if (!productId) return;
      if (this.isInWishlist(productId)) return;
      const listId = listID ? listID : this.wishlist[0]?.id;

      if (this.isAuthenticated) {
        const { success, data } = await this.addProductAPI(productId, listId);
        console.log("addResp", data);

        if (success) {
          this.updateWishlist(data);
          this.dispatchEvent("wishlist:add", { productId });
          console.log("analytics added");
        }
        return success;
      } else {
        // todo fetch product and save in LS
        // this.items.push(productId);
        // this.saveItems();
        // this.dispatchEvent("wishlist:add", { productId });
        return true;
      }
    }

    async removeItem(productId) {
      if (!productId) return;
      if (!this.isInWishlist(productId)) return;

      if (this.isAuthenticated) {
        const { success, data } = await this.removeProductAPI(productId);
        console.log("removeResp", data);
        if (success) {
          this.updateWishlist(data);
          this.dispatchEvent("wishlist:remove", { productId });
          console.log("analytics removed");
        }
        return success;
      } else {
        // todo fetch product and save in LS
        // this.items.push(productId);
        // this.saveItems();
        // this.dispatchEvent("wishlist:add", { productId });
        return true;
      }
    }

    // async fetchListById(id) {
    //   if (!id) return;
    //   try {
    //     const response = await fetch(`${this.apiEndpoint}/list/${id}`, {
    //       method: "GET",
    //       credentials: "same-origin",
    //     });
    //     if (response.ok) {
    //       const data = await response.json();
    //       console.log(data);
    //       return data.items || [];
    //     } else {
    //       console.error("Failed to fetch wishlist from API");
    //       return [];
    //     }
    //   } catch (error) {
    //     console.error("Error fetching wishlist:", error);
    //     return [];
    //   }
    // }

    isInWishlist(productId) {
      if (!productId || !this.wishlist?.length) return;
      return this.wishlist.some((list) => list.product_ids.includes(productId));
    }

    dispatchEvent(eventName, detail = {}) {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    }

    // await this.loadFirstPopulatedList();

    updateCount(newValue) {
      // todo - refactor
      if (!this.countEl || !newValue) return;
      this.countEl.textContent = newValue;
    }
    firstLoad() {
      // add loading state

      this.updateCount(this.count);
      const allBtns = document.querySelectorAll("[abr-wl-button]");

      allBtns.forEach((node) => {
        const productId = node.getAttribute("data-product-id");
        if (this.isInWishlist(productId)) {
          node.classList.add("awl-is-added");
        }
      });
    }

    async init() {
      await this.loadWishlist();
      //   this.observeDOM();
      //   or
      this.firstLoad();
      this.attachListeners();
    }

    attachListeners() {
      document.body.addEventListener("click", async (e) => {
        const button = e.target.closest("[abr-wl-button]");
        if (button) {
          const productId = button.getAttribute("data-product-id");
          if (this.isInWishlist(productId)) {
            // optimistic UI
            // todo - refactor
            button.classList.remove("awl-is-added");
            const success = await this.removeItem(productId);
            if (!success) button.classList.add("awl-is-added");
          } else {
            // todo - refactor
            button.classList.add("awl-is-added");
            const success = await this.addItem(productId);
            if (!success) button.classList.remove("awl-is-added");
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
