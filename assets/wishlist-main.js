(function () {
  class Wishlist {
    constructor() {
      this.storageKey = "abrio_wl_items";
      this.apiEndpoint = window.abrwl.root_url + "apps/wishlist";

      //   todo - token for guest to save after logged in
      //   this.guestToken = ...
      this.customerId =  window.abrwl.customerId;
      this.isAuthenticated = !!this.customerId;

      //   this.items = this.loadItems();
      this.init();
    }

    // resync items option !!!!!!!!!!!

    loadItems() {
      if (this.isAuthenticated) {
        // check if need to fetch
        this.fetchWishlist();
        // then save in local storage
        // before this check local storage
      } else {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
      }
    }

    saveItems() {
      if (this.isAuthenticated) {
        this.syncWishlistWithAPI();
      } else {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      }
    }

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

    
    async syncWishlistWithAPI() {
      try {
        await fetch(`${this.apiEndpoint}/sync`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: this.items }),
        });
      } catch (error) {
        console.error("Error syncing wishlist:", error);
      }
    }
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
      return this.items.includes(productId);
    }

    dispatchEvent(eventName, detail = {}) {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    }

    init() {
      //   this.observeDOM();
      //   this.attachListeners();
    }

    attachListeners() {
      document.body.addEventListener("click", (e) => {
        const button = e.target.closest("[abr-wl-button]");
        if (button) {
          const productId = button.getAttribute("data-product-id");
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
