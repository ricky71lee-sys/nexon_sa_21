/**
 * control.js — 스크롤·네비 컨트롤
 *
 * [pageScroll] GNB + sticky topbar 보정 스크롤 (--scroll-offset)
 * HTML:
 *   data-scroll-to="#event01"      — 클릭 시 앵커 이동
 *   data-scroll-active="#event01"  — 클릭 이동 + 스크롤 구간 is-active
 */
$(function () {
  window.body = {
    scroll: function (fn) {
      $(window).on("scroll", fn);
    },
  };

  window.pageScroll = {
    /** 고정 영역은 넥슨 GNB만 (이벤트 topbar는 sticky/fixed 아님) */
    getOffset: function () {
      const gnb =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--gnb-height")
        ) || 0;
      return Math.round(gnb);
    },

    syncOffset: function () {
      document.documentElement.style.setProperty(
        "--scroll-offset",
        this.getOffset() + "px"
      );
    },

    /** section[id^=event] → .sec-head 기준 (제목이 topbar 바로 아래) */
    resolveTarget: function (el) {
      if (!el) return null;
      if (el.matches && el.matches("section[id^='event']")) {
        return el.querySelector(".sec-head") || el;
      }
      return el;
    },

    /**
     * scrollIntoView 대신 직접 좌표 계산 — sticky/GNB 오차 방지
     * @param {string|Element} target
     * @param {number} speed — 0: 즉시
     */
    to: function (target, speed) {
      const selector =
        typeof target === "string"
          ? target.charAt(0) === "#"
            ? target
            : "#" + target
          : null;
      const section =
        typeof target === "string" ? document.querySelector(selector) : target;
      if (!section) return;

      this.syncOffset();
      const el = this.resolveTarget(section);
      if (!el) return;

      const offset = this.getOffset();
      const y = Math.max(
        0,
        Math.round(el.getBoundingClientRect().top + window.pageYOffset - offset)
      );

      window.scrollTo({
        top: y,
        behavior: speed === 0 ? "auto" : "smooth",
      });
    },

    initHash: function () {
      if (!location.hash) return;
      const hash = location.hash;
      const self = this;
      this.syncOffset();
      // GNB 로드·레이아웃 안정화 후 이동
      setTimeout(function () {
        self.syncOffset();
        self.to(hash, 0);
      }, 200);
      setTimeout(function () {
        self.syncOffset();
        self.to(hash, 0);
      }, 600);
    },

    /** 스크롤 위치에 맞는 활성 섹션 id (#event01 …) */
    getActiveSectionId: function () {
      const offset = this.getOffset();
      const probe = window.pageYOffset + offset + 2;
      const sections = document.querySelectorAll("section[id^='event']");
      let active = null;

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const top = sec.getBoundingClientRect().top + window.pageYOffset;
        if (probe >= top) active = "#" + sec.id;
      }
      return active;
    },

    updateActiveNav: function () {
      const active = this.getActiveSectionId();
      document.querySelectorAll("[data-scroll-active]").forEach(function (el) {
        const target = el.getAttribute("data-scroll-active") || el.dataset.scrollActive;
        el.classList.toggle("is-active", !!active && target === active);
      });
    },
  };

  window.bodyScroll = {
    show: function () {
      $("body").css({ overflow: "", paddingRight: "" });
    },
    hide: function () {
      $("body").css({
        overflow: "hidden",
        paddingRight: window.innerWidth - document.body.clientWidth + "px",
      });
    },
    move: function (target, speed) {
      pageScroll.to(target, speed === undefined ? 500 : speed);
    },
  };

  $("[data-scroll-to]").on("click", function (e) {
    e.preventDefault();
    pageScroll.to($(this).data("scrollTo"));
  });

  const $scrollActive = $("[data-scroll-active]");
  if ($scrollActive.length) {
    $scrollActive.on("click", function (e) {
      e.preventDefault();
      pageScroll.to($(this).data("scrollActive"));
    });

    body.scroll(function () {
      pageScroll.updateActiveNav();
    });
  }

  pageScroll.syncOffset();
  pageScroll.updateActiveNav();
  pageScroll.initHash();

  $(window).on("resize", function () {
    pageScroll.syncOffset();
    pageScroll.updateActiveNav();
  });

  // GNB 높이 변경(배너·MO 메뉴) 후 오프셋 재동기화
  const prevFn = window.fnGnbResize;
  window.fnGnbResize = function (height) {
    if (typeof prevFn === "function") prevFn(height);
    else {
      var h = typeof height === "number" ? height : parseInt(height, 10);
      if (!h || h < 0) h = 62;
      document.documentElement.style.setProperty("--gnb-height", h + "px");
    }
    pageScroll.syncOffset();
    pageScroll.updateActiveNav();
  };
});
