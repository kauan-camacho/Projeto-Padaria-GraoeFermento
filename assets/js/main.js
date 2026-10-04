/* ==========================================================================
   Grão & Fermento — main.js
   Vanilla JS, no dependencies. Modules are self-initialising:
   each one bails out quietly if its markup is not on the page.
   --------------------------------------------------------------------------
   01  Helpers
   02  Image fallback
   03  Sticky header
   04  Mobile navigation drawer
   05  Cart (localStorage + drawer + WhatsApp checkout)
   06  Toasts
   07  Menu filtering + search
   08  Testimonials slider
   09  Accordion
   10  Forms (contact + newsletter)
   11  Scroll reveal
   12  Back to top
   13  Open/closed status
   14  Footer year
   ========================================================================== */

(function () {
  "use strict";

  /* ======================================================================
     01  HELPERS
     ====================================================================== */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const STORE_KEY = "gf_cart_v1";
  const BRAND = "Grão & Fermento";
  const WHATSAPP = "5511987654321"; // <- número com DDI + DDD, sem espaços

  const brl = (cents) =>
    (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  /* Simple focus trap for drawers/modals */
  function trapFocus(container, e) {
    const focusables = $$(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      container
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ======================================================================
     02  IMAGE FALLBACK
     Replaces broken remote images with a warm branded placeholder so the
     layout never collapses.
     ====================================================================== */

  function initImageFallback() {
    $$("img[data-fallback]").forEach((img) => {
      const fallback = () => {
        img.src =
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#f9f7f5"/>
                  <stop offset="1" stop-color="#e3dbd3"/>
                </linearGradient>
              </defs>
              <rect width="400" height="300" fill="url(#g)"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                    font-family="Georgia,serif" font-size="46" fill="#b14a16">${img
              .dataset.fallback
            }</text>
            </svg>`
          );
        img.onerror = null;
      };
      img.addEventListener("error", fallback);
      if (img.complete && img.naturalWidth === 0) fallback();
    });
  }

  /* ======================================================================
     03  STICKY HEADER
     ====================================================================== */

  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    const onScroll = () =>
      header.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ======================================================================
     04  DRAWERS (mobile nav + cart share the same shell)
     ====================================================================== */

  const overlay = $(".overlay");
  let lastFocused = null;

  function openDrawer(drawer) {
    if (!drawer) return;
    lastFocused = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (overlay) overlay.classList.add("is-open");
    document.body.classList.add("is-locked");
    const first = $("a, button", drawer);
    setTimeout(() => first && first.focus(), 120);
  }

  function closeDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (overlay) overlay.classList.remove("is-open");
    if (!$(".drawer.is-open")) document.body.classList.remove("is-locked");
    if (lastFocused) lastFocused.focus();
  }

  function closeAllDrawers() {
    $$(".drawer.is-open").forEach(closeDrawer);
  }

  function initDrawers() {
    $$("[data-open-drawer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.openDrawer);
        openDrawer(target);
      });
    });

    $$("[data-close-drawer]").forEach((btn) => {
      btn.addEventListener("click", () => closeDrawer(btn.closest(".drawer")));
    });

    if (overlay) overlay.addEventListener("click", closeAllDrawers);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const open = $(".drawer.is-open");
      if (open) {
        closeDrawer(open);
        return;
      }
      closeAllDrawers();
    });

    // Focus trap while a drawer is open
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const open = $(".drawer.is-open");
      if (open) trapFocus(open, e);
    });

    // Burger aria state
    $$(".burger").forEach((b) =>
      b.addEventListener("click", () => {
        const drawer = document.getElementById(b.dataset.openDrawer);
        const isOpen = drawer && drawer.classList.contains("is-open");
        b.setAttribute("aria-expanded", String(!isOpen));
      })
    );

    // Close mobile nav when a link is tapped
    $$(".mnav__link").forEach((a) =>
      a.addEventListener("click", () => {
        closeDrawer(a.closest(".drawer"));
        $$(".burger").forEach((b) => b.setAttribute("aria-expanded", "false"));
      })
    );

    // Reset burger state whenever a drawer closes
    const observer = new MutationObserver(() => {
      if (!$(".drawer.is-open")) {
        $$(".burger").forEach((b) => b.setAttribute("aria-expanded", "false"));
      }
    });
    if ($(".drawer")) observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  /* ======================================================================
     05  CART
     ====================================================================== */

  const Cart = {
    items: [],

    load() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        this.items = raw ? JSON.parse(raw) : [];
      } catch (err) {
        this.items = [];
      }
    },

    save() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(this.items));
      } catch (err) {
        /* storage full / blocked — cart still works for the session */
      }
    },

    add(id, name, price, img) {
      const found = this.items.find((i) => i.id === id);
      if (found) found.qty += 1;
      else this.items.push({ id, name, price, img, qty: 1 });
      this.save();
      this.render();
    },

    setQty(id, qty) {
      const item = this.items.find((i) => i.id === id);
      if (!item) return;
      if (qty <= 0) return this.remove(id);
      item.qty = qty;
      this.save();
      this.render();
    },

    remove(id) {
      this.items = this.items.filter((i) => i.id !== id);
      this.save();
      this.render();
    },

    clear() {
      this.items = [];
      this.save();
      this.render();
    },

    get count() {
      return this.items.reduce((sum, i) => sum + i.qty, 0);
    },

    get total() {
      return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },

    message() {
      const lines = this.items.map(
        (i) => `• ${i.qty}x ${i.name} — ${brl(i.price * i.qty)}`
      );
      // Real newlines, not a hand-encoded "%0A": this string is passed through
      // encodeURIComponent once when the checkout link is built, so a "%0A"
      // written here would survive as the literal text "%0A" in the chat and
      // the whole order would arrive as one run-on line.
      return (
        `Olá! Gostaria de fazer um pedido na *${BRAND}*:\n\n` +
        lines.join("\n") +
        `\n\n*Total: ${brl(this.total)}*\n\nNome:\nRetirada em: `
      );
    },

    render() {
      // Badges (the digit is decorative here — the button label carries the count).
      // Render no digit at all when empty: the badge is only scaled to 0, not
      // display:none, so a lingering "0" would read as a visible label that the
      // button's accessible name doesn't contain.
      $$("[data-cart-count]").forEach((el) => {
        el.textContent = this.count > 0 ? this.count : "";
        el.classList.toggle("is-visible", this.count > 0);
        el.setAttribute("aria-hidden", "true");
      });

      // Keep the trigger's accessible name in sync with the visible counter
      $$("[data-open-cart]").forEach((btn) => {
        const n = this.count;
        btn.setAttribute(
          "aria-label",
          n > 0
            ? `Abrir meu pedido — ${n} ${n === 1 ? "item" : "itens"}`
            : "Abrir meu pedido"
        );
      });

      // List
      const list = $("[data-cart-list]");
      const empty = $("[data-cart-empty]");
      const totalEl = $("[data-cart-total]");
      const foot = $("[data-cart-foot]");
      const checkout = $("[data-cart-checkout]");

      if (!list) return;

      if (this.items.length === 0) {
        list.innerHTML = "";
        list.classList.add("is-hidden");
        if (empty) empty.classList.remove("is-hidden");
        if (foot) foot.classList.add("is-hidden");
        return;
      }

      list.classList.remove("is-hidden");
      if (empty) empty.classList.add("is-hidden");
      if (foot) foot.classList.remove("is-hidden");

      list.innerHTML = this.items
        .map(
          (i) => `
        <div class="cart-item">
          <img class="cart-item__img" src="${i.img}" alt="" loading="lazy">
          <div>
            <p class="cart-item__name">${i.name}</p>
            <div class="cart-item__meta">
              <div class="qty" role="group" aria-label="Quantidade de ${i.name}">
                <button class="qty__btn" data-qty-down="${i.id}" aria-label="Diminuir quantidade">&minus;</button>
                <span class="qty__val">${i.qty}</span>
                <button class="qty__btn" data-qty-up="${i.id}" aria-label="Aumentar quantidade">+</button>
              </div>
              <span class="cart-item__price">${brl(i.price * i.qty)}</span>
            </div>
            <button class="cart-item__remove mt-3" data-remove="${i.id}">Remover</button>
          </div>
        </div>`
        )
        .join("");

      if (totalEl) totalEl.textContent = brl(this.total);
      if (checkout) checkout.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(this.message())}`;
    },
  };

  function initCart() {
    Cart.load();
    Cart.render();

    // Add to cart buttons
    $$("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { add, name, price, img, emoji } = btn.dataset;
        Cart.add(add, name, Number(price), img);
        toast(`${name} adicionado ao pedido`, emoji || "🥐");

        // Micro-feedback on the button
        const label = btn.querySelector("[data-add-label]") || btn;
        const original = label.textContent;
        btn.classList.add("is-added");
        label.textContent = "Adicionado ✓";
        setTimeout(() => {
          btn.classList.remove("is-added");
          label.textContent = original;
        }, 1400);
      });
    });

    // Delegated controls inside the cart list
    const list = $("[data-cart-list]");
    if (list) {
      list.addEventListener("click", (e) => {
        const down = e.target.closest("[data-qty-down]");
        const up = e.target.closest("[data-qty-up]");
        const rm = e.target.closest("[data-remove]");

        if (down) {
          const item = Cart.items.find((i) => i.id === down.dataset.qtyDown);
          if (item) Cart.setQty(item.id, item.qty - 1);
        } else if (up) {
          const item = Cart.items.find((i) => i.id === up.dataset.qtyUp);
          if (item) Cart.setQty(item.id, item.qty + 1);
        } else if (rm) {
          Cart.remove(rm.dataset.remove);
        }
      });
    }

    const clearBtn = $("[data-cart-clear]");
    if (clearBtn)
      clearBtn.addEventListener("click", () => {
        Cart.clear();
        toast("Pedido limpo");
      });

    const openBtn = $("[data-open-cart]");
    if (openBtn) {
      openBtn.addEventListener("click", () =>
        openDrawer(document.getElementById("cart-drawer"))
      );
    }
  }

  /* ======================================================================
     06  TOASTS
     ====================================================================== */

  function toast(message, emoji) {
    const stack = $(".toast-stack");
    if (!stack) return;

    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${
        emoji && emoji.length <= 2 ? emoji : "✓"
      }</span>
      <span>${message}</span>`;
    stack.appendChild(el);

    setTimeout(() => {
      el.classList.add("is-out");
      el.addEventListener("animationend", () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 600);
    }, 2800);
  }

  /* ======================================================================
     07  MENU FILTER + SEARCH
     ====================================================================== */

  function initMenu() {
    const grid = $("[data-menu-grid]");
    if (!grid) return;

    const cards = $$("[data-cat]", grid);
    const filterBtns = $$("[data-filter]");
    const searchInput = $("[data-search]");
    const clearBtn = $("[data-search-clear]");
    const counter = $("[data-result-count]");
    const noResults = $("[data-no-results]");

    let activeFilter = "all";
    let query = "";

    const normalize = (s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    function apply() {
      let visible = 0;

      cards.forEach((card) => {
        const catOK =
          activeFilter === "all" || card.dataset.cat === activeFilter;
        const haystack = normalize(
          `${card.dataset.name || ""} ${card.textContent}`
        );
        const queryOK = !query || haystack.includes(query);
        const show = catOK && queryOK;

        card.classList.toggle("is-hidden", !show);
        if (show) visible += 1;
      });

      if (counter) {
        counter.textContent =
          visible === 1
            ? "1 produto encontrado"
            : `${visible} produtos encontrados`;
      }
      if (noResults) noResults.classList.toggle("is-hidden", visible !== 0);
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        filterBtns.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        apply();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = normalize(searchInput.value.trim());
        if (clearBtn) clearBtn.classList.toggle("is-shown", !!searchInput.value);
        apply();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        query = "";
        clearBtn.classList.remove("is-shown");
        searchInput.focus();
        apply();
      });
    }

    // Deep link: cardapio.html?cat=paes
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("cat");
    if (preset) {
      const match = filterBtns.find((b) => b.dataset.filter === preset);
      if (match) match.click();
    } else {
      apply();
    }
  }

  /* ======================================================================
     08  TESTIMONIALS SLIDER
     ====================================================================== */

  function initSlider() {
    const viewport = $("[data-slider]");
    if (!viewport) return;

    const track = $(".tst-track", viewport);
    const slides = $$(".tst", track);
    const dotsWrap = $("[data-slider-dots]");
    const prev = $("[data-slider-prev]");
    const next = $("[data-slider-next]");
    if (!track || slides.length === 0) return;

    let index = 0;
    let timer = null;
    const DELAY = 7000;

    // Build dots
    if (dotsWrap) {
      dotsWrap.innerHTML = slides
        .map(
          (_, i) =>
            `<button class="tst__dot${
              i === 0 ? " is-active" : ""
            }" data-dot="${i}" aria-label="Depoimento ${i + 1}"></button>`
        )
        .join("");
    }

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      $$("[data-dot]", dotsWrap || document).forEach((d, di) =>
        d.classList.toggle("is-active", di === index)
      );
    }

    function play() {
      if (prefersReducedMotion()) return;
      stop();
      timer = setInterval(() => go(index + 1), DELAY);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    if (next) next.addEventListener("click", () => { go(index + 1); play(); });
    if (prev) prev.addEventListener("click", () => { go(index - 1); play(); });

    if (dotsWrap) {
      dotsWrap.addEventListener("click", (e) => {
        const d = e.target.closest("[data-dot]");
        if (!d) return;
        go(Number(d.dataset.dot));
        play();
      });
    }

    // Pause on hover / focus / tab hidden
    ["mouseenter", "focusin"].forEach((ev) =>
      viewport.addEventListener(ev, stop)
    );
    ["mouseleave", "focusout"].forEach((ev) =>
      viewport.addEventListener(ev, play)
    );
    document.addEventListener("visibilitychange", () =>
      document.hidden ? stop() : play()
    );

    // Keyboard
    viewport.setAttribute("tabindex", "0");
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { go(index + 1); play(); }
      if (e.key === "ArrowLeft") { go(index - 1); play(); }
    });

    // Touch swipe
    let startX = 0;
    let delta = 0;
    viewport.addEventListener(
      "touchstart",
      (e) => { startX = e.touches[0].clientX; delta = 0; stop(); },
      { passive: true }
    );
    viewport.addEventListener(
      "touchmove",
      (e) => { delta = e.touches[0].clientX - startX; },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      () => {
        if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1));
        play();
      }
    );

    go(0);
    play();
  }

  /* ======================================================================
     09  ACCORDION
     ====================================================================== */

  function initAccordion() {
    $$("[data-acc-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = document.getElementById(
          btn.getAttribute("aria-controls")
        );
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        if (panel) panel.dataset.open = String(!open);
      });
    });
  }

  /* ======================================================================
     10  FORMS
     ====================================================================== */

  function showFieldError(input, message) {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.add("has-error");
    const err = $(".field__error", field);
    if (err && message) err.textContent = message;
    input.setAttribute("aria-invalid", "true");
  }

  function clearFieldError(input) {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
  }

  /* Each rule returns `true` when it passes, or the error message to show.
     (Returning a message string is a common trap here: a non-empty string is
     truthy, so a naive `!validator(value)` check would never fail.) */
  const validators = {
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())
        ? true
        : "Informe um e-mail válido (ex.: nome@email.com).",
    phone: (v) => {
      const d = v.replace(/\D/g, "");
      return d.length >= 10 && d.length <= 13
        ? true
        : "Informe um telefone com DDD (ex.: (11) 98765-4321).";
    },
    min: (n) => (v) =>
      v.trim().length >= n ? true : `Precisa de pelo menos ${n} caracteres.`,
  };

  function validateInput(input) {
    const value = input.value || "";
    const rules = (input.dataset.rules || "").split(" ").filter(Boolean);
    const type = (input.type || "text").toLowerCase();

    /* A checkbox/radio reports its `value` ("on" by default) whether or not it
       is ticked, so `required` has to read `checked` instead. */
    function isFilled() {
      if (type === "checkbox") return input.checked;
      if (type === "radio") {
        const group = input.form
          ? $$('input[type="radio"][name="' + input.name + '"]', input.form)
          : [input];
        return group.some((r) => r.checked);
      }
      return value.trim().length > 0;
    }

    for (const rule of rules) {
      const [name, arg] = rule.split(":");

      // `required` must be evaluated even when the field is empty.
      if (name === "required") {
        if (!isFilled()) {
          showFieldError(input, "Este campo é obrigatório.");
          return false;
        }
        continue;
      }

      // Every other rule is skipped while the field is still empty.
      if (!value.trim()) continue;

      let r = true;
      if (name === "email") r = validators.email(value);
      else if (name === "phone") r = validators.phone(value);
      else if (name === "min") r = validators.min(Number(arg))(value);

      if (r !== true) {
        showFieldError(input, r);
        return false;
      }
    }

    clearFieldError(input);
    return true;
  }

  function initForms() {
    $$("[data-rules]").forEach((input) => {
      // Validate on blur, then live-correct once the field is invalid
      input.addEventListener("blur", () => validateInput(input));
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (field && field.classList.contains("has-error")) validateInput(input);
      });
    });

    $$("[data-form]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const inputs = $$("[data-rules]", form);
        let ok = true;
        let firstBad = null;

        inputs.forEach((input) => {
          const valid = validateInput(input);
          if (!valid) {
            ok = false;
            if (!firstBad) firstBad = input;
          }
        });

        const msg =
          $("[data-form-msg]", form) || $("[data-form-msg]");
        const showMsg = (type, text) => {
          if (!msg) {
            // Never swallow feedback just because the banner is missing.
            toast(text, type === "ok" ? "✓" : "!");
            return;
          }
          msg.className = `form-msg form-msg--${type} is-shown`;
          msg.innerHTML = `<span aria-hidden="true">${
            type === "ok" ? "✓" : "!"
          }</span><span>${text}</span>`;
          msg.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "center",
          });
        };

        if (!ok) {
          showMsg(
            "err",
            "Não foi possível enviar. Revise os campos destacados e tente novamente."
          );
          if (firstBad) firstBad.focus();
          return;
        }

        // Honeypot — bots fill it, humans never see it
        const honey = $('[name="website"]', form);
        if (honey && honey.value) return;

        const submit = $('[type="submit"]', form);
        if (submit) submit.classList.add("is-loading");

        // Simulated async send (swap for a real endpoint)
        setTimeout(() => {
          if (submit) {
            submit.classList.remove("is-loading");
            submit.disabled = false;
          }

          const name = ($("[data-name]", form) || {}).value;
          showMsg(
            "ok",
            `Obrigado${name ? ", " + name.split(" ")[0] : ""}! Recebemos sua mensagem e respondemos em até 1 dia útil. ${
              form.dataset.form === "newsletter"
                ? "Seu cupom de 10% chega por e-mail."
                : ""
            }`
          );

          form.reset();
          $$(".field", form).forEach((f) => f.classList.remove("has-error"));
          toast("Mensagem enviada com sucesso ✓");
        }, 1100);
      });
    });
  }

  /* ======================================================================
     11  SCROLL REVEAL
     ====================================================================== */

  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((el, i) => {
      // Stagger siblings inside the same grid
      const parent = el.parentElement;
      if (parent) {
        const sibs = $$(".reveal", parent);
        const pos = sibs.indexOf(el);
        if (pos > -1 && pos < 4) {
          el.style.setProperty("--reveal-delay", `${pos * 90}ms`);
        }
      }
      io.observe(el);
      void i;
    });
  }

  /* ======================================================================
     12  BACK TO TOP
     ====================================================================== */

  function initBackToTop() {
    const btn = $(".fab--top");
    if (!btn) return;
    const onScroll = () =>
      btn.classList.toggle("is-shown", window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", () =>
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      })
    );
  }

  /* ======================================================================
     12a  WHATSAPP CALL TO ACTION
     ----------------------------------------------------------------------
     Two jobs, both about not making the visitor do the typing:

     1. Pre-fill the conversation. Every wa.me link used to open a blank chat
        except the three subscription plans, so the visitor landed in an empty
        message box and had to work out what to write. Each page now supplies
        its own intent through data-wa-msg, and links without one get a
        general greeting built from BRAND.

     2. Keep the accessible name honest. The floating button used to hardcode
        "Falar com a padaria..." in four HTML files while the brand name lived
        in one JS constant - rename the brand and the label silently went
        stale. It is derived from BRAND here instead.

     The HTML keeps a sensible static href and label, so with JavaScript off
     the links still resolve to a real chat; this only refines them.
     ====================================================================== */

  function initWhatsappCta() {
    const greeting =
      "Olá! Vim pelo site da " + BRAND + " e gostaria de fazer um pedido.";

    $$('a[href*="wa.me"]').forEach((link) => {
      const href = link.getAttribute("href") || "";

      // Never touch a link that already carries a message: the cart builds
      // its own order summary, and the plans have hand-written copy.
      if (href.indexOf("?text=") === -1) {
        const message = link.dataset.waMsg || greeting;
        // Split by hand rather than via URL(): URLSearchParams would encode
        // spaces as "+", and the hand-written links use %20.
        link.setAttribute(
          "href",
          href + "?text=" + encodeURIComponent(message)
        );
      }
    });

    const fab = $(".fab--wa");
    if (fab) fab.setAttribute("aria-label", "Falar com a " + BRAND + " no WhatsApp");
  }

  /* ======================================================================
     12b  FLOATING STACK vs. PAGE CONTENT
     ----------------------------------------------------------------------
     The shortcut stack is fixed to the bottom-right corner, so it sits on top
     of whatever scrolls underneath it. That silently swallowed taps meant for
     the contact form fields, the menu search box, the category filters, the
     "add to cart" buttons and every accordion header.

     The stack is tucked away whenever an interactive control overlaps it. The
     overlap test is a straight rectangle intersection against a cached control
     list: overlaps are frequently thin slivers along the right edge of a
     control, and both point sampling and IntersectionObserver missed those
     (the latter additionally stops reporting while the page is not painting,
     which is exactly when a stale stack would be left on screen).
     ====================================================================== */

  function initFabStackGuard() {
    const stack = $(".fab-stack");
    if (!stack) return;

    const CONTROLS = "a[href], button, input, textarea, select, [tabindex]";
    let controls = $$(CONTROLS).filter((el) => el !== stack && !stack.contains(el));
    let queued = false;

    const evaluate = () => {
      queued = false;
      const box = stack.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;

      if (box.bottom < 0 || box.top > window.innerHeight) {
        stack.classList.remove("is-tucked");
        return;
      }

      // Reads only, no interleaved writes: the browser flushes layout once and
      // the remaining reads are cheap, so this stays well under a frame.
      let blocked = false;
      for (let i = 0; i < controls.length; i++) {
        const b = controls[i].getBoundingClientRect();
        if (b.width < 1 || b.height < 1) continue;
        if (b.bottom <= box.top || b.top >= box.bottom) continue;
        if (b.right <= box.left || b.left >= box.right) continue;
        blocked = true;
        break;
      }
      stack.classList.toggle("is-tucked", blocked);
    };

    // Time-throttled rather than requestAnimationFrame: rAF is suspended in a
    // background tab, and this is a correctness check rather than a paint tweak.
    const schedule = () => {
      if (queued) return;
      queued = true;
      setTimeout(evaluate, 90);
    };
    const recheck = () => {
      controls = $$(CONTROLS).filter((el) => el !== stack && !stack.contains(el));
      schedule();
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("load", recheck);
    // Opening a panel, a drawer or a focused field changes the layout without
    // scrolling, so re-check on those too.
    document.addEventListener("click", schedule, true);
    document.addEventListener("focusin", schedule, true);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) schedule();
    });
    if (typeof MutationObserver === "function") {
      new MutationObserver(recheck).observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
    evaluate();
  }

  /* ======================================================================
     13  OPEN / CLOSED STATUS  (+ highlight today's hours)
     ====================================================================== */

  function initOpenStatus() {
    const nodes = $$("[data-open-status]");
    if (!nodes.length) return;

    // 0 = Sunday. Schedule index below matches Monday-first ordering.
    const SCHEDULE = [
      null, // domingo
      [7, 19], // segunda
      [7, 19],
      [7, 19],
      [7, 19],
      [7, 20], // sexta
      [7, 20], // sábado
      [7, 13], // domingo
    ];

    function refresh() {
      const now = new Date();
      const today = now.getDay();
      const mins = now.getHours() * 60 + now.getMinutes();
      const range = SCHEDULE[today];
      const isOpen = range
        ? mins >= range[0] * 60 && mins < range[1] * 60
        : false;

      nodes.forEach((el) => {
        el.classList.toggle("is-closed", !isOpen);
        const label = $("[data-open-label]", el) || el;
        label.textContent = isOpen
          ? "Aberto agora"
          : "Fechado agora — abrimos às 7h";
      });
    }

    refresh();
    setInterval(refresh, 60000);

    // Highlight today's row in hours tables
    const jsDay = new Date().getDay();
    const row = jsDay === 0 ? 7 : jsDay; // map to Monday-first index
    $$(`[data-day="${row}"]`).forEach((r) => r.classList.add("is-today"));
  }

  /* ======================================================================
     14  FOOTER YEAR
     ====================================================================== */

  function initYear() {
    $$("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */

  function boot() {
    initImageFallback();
    initHeader();
    initDrawers();
    initCart();
    initMenu();
    initSlider();
    initAccordion();
    initForms();
    initReveal();
    initBackToTop();
    initWhatsappCta();
    initFabStackGuard();
    initOpenStatus();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Expose for console tinkering / debugging
  window.GF = { Cart, toast, openDrawer, closeAllDrawers };
})();
