/**
 * utils.js — 공용 모달·스크롤 락
 *
 * Utils.alert(msg, options)    — 확인 1버튼, Promise<boolean>
 * Utils.confirm(msg, options)  — 예/아니오(또는 커스텀 라벨), Promise<boolean>
 *   options.confirmText / cancelText / confirmOnly / title / note / variant
 * Utils.bodyScroll.hide/show
 *
 * DOM: .modal-shade, .modal.modal-confirm
 * 스타일: assets/styles/partials/_modals.scss
 */
(function (window) {
  const createElement = (tagName, className) => {
    const element = document.createElement(tagName);
    if (!className) return element;
    if (Array.isArray(className)) {
      element.classList.add(...className);
    } else {
      element.classList.add(className);
    }
    return element;
  };

  const createModal = (msg, options) => {
    const shade = createElement("div", "modal-shade");
    const modal = createElement("div", ["modal", "modal-confirm"]);
    if (options.variant === "warn") modal.classList.add("is-warn");
    if (options.variant === "info") modal.classList.add("is-info");

    const buttons = createElement("div", "modal-buttons");

    if (options.buttonClose) {
      modal.appendChild(createElement("button", "modal-button__close"));
    }
    if (options.image) {
      const imageDiv = createElement("div", "modal-image");
      const image = createElement("img");
      image.src = options.image;
      imageDiv.appendChild(image);
      modal.appendChild(imageDiv);
    }
    if (options.titleHtml || options.title) {
      const title = createElement("h4", "modal-title");
      if (options.titleHtml) title.innerHTML = options.titleHtml;
      else title.textContent = options.title;
      modal.appendChild(title);
    }
    if (options.variant === "info") {
      const icon = createElement("div", "modal-icon");
      icon.setAttribute("aria-hidden", "true");
      modal.insertBefore(icon, modal.firstChild);
    }

    const message = createElement("p", "modal-message");
    message.innerHTML = msg;
    modal.appendChild(message);

    if (options.note) {
      const note = createElement("div", "modal-note");
      note.innerHTML = options.note;
      modal.appendChild(note);
    }

    modal.appendChild(buttons);
    return { shade, modal, buttons };
  };

  const showModal = (el) => {
    document.body.appendChild(el.shade);
    document.body.appendChild(el.modal);
    Utils.bodyScroll.hide();
  };

  const closeModal = (el, callback) => {
    document.body.removeChild(el.shade);
    document.body.removeChild(el.modal);
    Utils.bodyScroll.show();
    if (callback) callback();
  };

  window.Utils = {
    alert: (
      message,
      {
        buttonClose = false,
        confirmText = "확인",
        title = "",
        titleHtml = "",
        note = "",
        variant = "",
      } = {}
    ) =>
      new Promise((resolve) => {
        const el = createModal(message, { buttonClose, title, titleHtml, note, variant });
        el.buttons.classList.add("is-single");
        el.buttons.appendChild(
          Object.assign(createElement("button", "modal-button__confirm"), {
            type: "button",
            textContent: confirmText,
          })
        );
        showModal(el);

        if (buttonClose) {
          el.modal
            .querySelector(".modal-button__close")
            .addEventListener("click", () => closeModal(el, () => resolve(true)));
        }
        el.modal
          .querySelector(".modal-button__confirm")
          .addEventListener("click", () => closeModal(el, () => resolve(true)));
        el.shade.addEventListener("click", () =>
          closeModal(el, () => resolve(true))
        );
      }),

    confirm: (
      message,
      {
        buttonClose = false,
        image = "",
        confirmText = "예",
        cancelText = "아니오",
        confirmOnly = false,
        title = "",
        titleHtml = "",
        note = "",
        variant = "",
      } = {}
    ) =>
      new Promise((resolve) => {
        const el = createModal(message, {
          buttonClose,
          image,
          title,
          titleHtml,
          note,
          variant,
        });

        if (confirmOnly) {
          el.buttons.classList.add("is-single");
          el.buttons.appendChild(
            Object.assign(createElement("button", "modal-button__yes"), {
              type: "button",
              textContent: confirmText,
            })
          );
        } else {
          el.buttons.appendChild(
            Object.assign(createElement("button", "modal-button__no"), {
              type: "button",
              textContent: cancelText,
            })
          );
          el.buttons.appendChild(
            Object.assign(createElement("button", "modal-button__yes"), {
              type: "button",
              textContent: confirmText,
            })
          );
        }

        showModal(el);

        if (buttonClose) {
          el.modal
            .querySelector(".modal-button__close")
            .addEventListener("click", () => closeModal(el, () => resolve(false)));
        }
        el.modal
          .querySelector(".modal-button__yes")
          .addEventListener("click", () => closeModal(el, () => resolve(true)));
        const noBtn = el.modal.querySelector(".modal-button__no");
        if (noBtn) {
          noBtn.addEventListener("click", () =>
            closeModal(el, () => resolve(false))
          );
        }
        el.shade.addEventListener("click", () =>
          closeModal(el, () => resolve(false))
        );
      }),

    bodyScroll: {
      show: () => {
        document.body.style.paddingRight = "";
        document.body.style.overflow = "";
      },
      hide: () => {
        const body = document.body;
        if (body.style.overflow === "") {
          body.style.paddingRight = window.innerWidth - body.clientWidth + "px";
          body.style.overflow = "hidden";
        }
      },
    },

    shareMeta: (() => {
      const DEFAULT = {
        title: "둘이서 하나, 서든어택 21주년",
        description: "메달 합체부터 출석·쇼케이스까지, 둘이서 더 풍성하게!",
        url: "https://csonline.nexon.com",
        urlLabel: "csonline.nexon.com",
        image: "./assets/images/og_share.png",
      };

      function toAbsoluteUrl(path) {
        if (/^https?:\/\//.test(path)) return path;
        return new URL(path.replace(/^\.\//, ""), window.location.href).href;
      }

      function setMeta(selector, content) {
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement("meta");
          const isProperty = selector.includes("property=");
          if (isProperty) {
            el.setAttribute("property", selector.match(/property="([^"]+)"/)[1]);
          } else {
            el.setAttribute("name", selector.match(/name="([^"]+)"/)[1]);
          }
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      }

      function apply(meta) {
        const next = { ...DEFAULT, ...meta };
        document.title = next.title;
        setMeta('meta[name="description"]', next.description);
        setMeta('meta[property="og:title"]', next.title);
        setMeta('meta[property="og:description"]', next.description);
        setMeta('meta[property="og:url"]', next.url);
        setMeta('meta[property="og:image"]', toAbsoluteUrl(next.image));
        setMeta('meta[name="twitter:title"]', next.title);
        setMeta('meta[name="twitter:description"]', next.description);
        setMeta('meta[name="twitter:image"]', toAbsoluteUrl(next.image));
      }

      return {
        DEFAULT,
        apply,
        reset: () => apply(DEFAULT),
        forMedal({ nick, code }) {
          apply({
            title: nick + "님이 메달 합체를 신청했어요!",
            description:
              "메달 코드를 입력하여 메달을 합치고 풍성한 보상 받으세요!\n메달 코드: " + code,
            url: DEFAULT.url + "?code=" + encodeURIComponent(code),
          });
        },
      };
    })(),
  };
})(window);
