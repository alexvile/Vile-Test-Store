(function () {
  class WishlistPage {
    constructor() {
      this.storageKey = "abrio_wl_data";
      this.cacheKey = "abrio_wl_cache";
      this.lists = [];
      this.init();
    }

    init() {}
  }

  const mm = new WishlistPage();
  window.wp = mm;
})();
