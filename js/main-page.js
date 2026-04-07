class Carousel {
  constructor(root, options = {}) {
    if (!root) return;
    this.root = root;
    this.options = {
      type: "track",
      loop: false,
      startIndex: 0,
      slidesToShow: 1,
      breakpoints: {},
      dots: false,
      dotsBelow: null,
      prev: null,
      next: null,
      activeClassTarget: null,
      autoplay: false,
      interval: 5000,
      pauseOnHover: true,
      ...options,
    };

    this.index = this.options.startIndex;
    this.touchStartX = 0;
    this.touchCurrentX = 0;
    this.swipeThreshold = 50;

    this.originalSlides = Array.from(this.root.children);
    if (!this.originalSlides.length) return;

    this.root.classList.add("carousel-root");

    if (this.options.type === "fade") {
      this.initFade();
    } else {
      this.initTrack();
    }

    this.bindControls();
    this.bindResize();
    this.bindKeyboard();
    this.initAutoplay();
    this.update();
  }

  initFade() {
    this.slides = this.originalSlides;
    this.slides.forEach((slide) => slide.classList.add("carousel-fade-slide"));
    this.createDots();
    this.bindTouch(this.root);
  }

  initTrack() {
    this.viewport = document.createElement("div");
    this.viewport.className = "carousel-viewport";

    this.track = document.createElement("div");
    this.track.className = "carousel-track";

    this.slides = this.originalSlides;
    this.slides.forEach((slide) => {
      slide.classList.add("carousel-slide");
      this.track.appendChild(slide);
    });

    this.viewport.appendChild(this.track);
    this.root.appendChild(this.viewport);

    this.createDots();
    this.bindTouch(this.viewport);
  }

  bindControls() {
    if (this.options.prev) {
      this.options.prev.addEventListener("click", () => this.prev());
    }
    if (this.options.next) {
      this.options.next.addEventListener("click", () => this.next());
    }
  }

  bindResize() {
    window.addEventListener("resize", () => this.update());
  }

  bindKeyboard() {
    this.root.setAttribute("tabindex", "0");
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.prev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.next();
      }
    });
  }

  initAutoplay() {
    if (!this.options.autoplay) return;

    const interval = Number(this.options.interval) || 5000;
    this.autoplayTimer = window.setInterval(() => this.next(), interval);

    if (this.options.pauseOnHover) {
      this.root.addEventListener("mouseenter", () => {
        if (this.autoplayTimer) {
          clearInterval(this.autoplayTimer);
          this.autoplayTimer = null;
        }
      });
      this.root.addEventListener("mouseleave", () => {
        if (!this.autoplayTimer) {
          this.autoplayTimer = window.setInterval(() => this.next(), interval);
        }
      });
    }
  }

  bindTouch(target) {
    if (!target) return;

    target.addEventListener(
      "touchstart",
      (event) => {
        this.touchStartX = event.touches[0].clientX;
        this.touchCurrentX = this.touchStartX;
      },
      { passive: true }
    );

    target.addEventListener(
      "touchmove",
      (event) => {
        this.touchCurrentX = event.touches[0].clientX;
      },
      { passive: true }
    );

    target.addEventListener("touchend", () => {
      const diff = this.touchStartX - this.touchCurrentX;
      if (Math.abs(diff) < this.swipeThreshold) return;
      if (diff > 0) this.next();
      else this.prev();
    });
  }

  getSlidesToShow() {
    const base = this.options.slidesToShow;
    const entries = Object.entries(this.options.breakpoints)
      .map(([bp, value]) => [Number(bp), value])
      .sort((a, b) => a[0] - b[0]);

    let result = base;
    entries.forEach(([bp, value]) => {
      if (window.innerWidth <= bp) result = value;
    });
    return Math.max(1, Number(result) || 1);
  }

  getMaxIndex() {
    if (this.options.type === "fade") return this.slides.length - 1;
    const show = this.getSlidesToShow();
    return Math.max(0, this.slides.length - show);
  }

  prev() {
    const max = this.getMaxIndex();
    if (this.index <= 0) {
      this.index = this.options.loop ? max : 0;
    } else {
      this.index -= 1;
    }
    this.update();
  }

  next() {
    const max = this.getMaxIndex();
    if (this.index >= max) {
      this.index = this.options.loop ? 0 : max;
    } else {
      this.index += 1;
    }
    this.update();
  }

  goTo(index) {
    const max = this.getMaxIndex();
    this.index = Math.min(Math.max(index, 0), max);
    this.update();
  }

  createDots() {
    if (!this.options.dots) return;
    this.dots = document.createElement("ul");
    this.dots.className = "carousel-dots";
    this.root.appendChild(this.dots);
  }

  renderDots() {
    if (!this.dots) return;

    const pages =
      this.options.type === "fade"
        ? this.slides.length
        : this.getMaxIndex() + 1;

    const activeDot = this.index;
    const shouldShow = this.options.dotsBelow
      ? window.innerWidth <= this.options.dotsBelow
      : true;

    this.dots.hidden = !shouldShow;
    this.dots.innerHTML = "";

    if (!shouldShow) return;

    for (let i = 0; i < pages; i += 1) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Перейти к слайду ${i + 1}`);
      button.setAttribute("aria-current", i === activeDot ? "true" : "false");
      if (i === activeDot) li.classList.add("is-active");
      button.addEventListener("click", () => this.goTo(i));
      li.appendChild(button);
      this.dots.appendChild(li);
    }
  }

  updateActiveTargets() {
    if (!this.options.activeClassTarget) return;
    const selector = this.options.activeClassTarget;
    this.slides.forEach((slide, slideIndex) => {
      const target = slide.querySelector(selector);
      if (!target) return;
      if (slideIndex === this.index) {
        target.classList.add("is-active");
      } else {
        target.classList.remove("is-active");
      }
    });
  }

  update() {
    const max = this.getMaxIndex();
    this.index = Math.min(this.index, max);

    if (this.options.type === "fade") {
      this.slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === this.index);
      });
    } else {
      const show = this.getSlidesToShow();
      this.root.style.setProperty("--slides-to-show", String(show));
      const translate = -(this.index * (100 / show));
      this.track.style.transform = `translateX(${translate}%)`;
      this.slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === this.index);
      });
    }

    this.renderDots();
    this.updateActiveTargets();
  }
}

function initPhoneDropdown() {
  const array = [
    ["Австралия", "+61"],
    ["Австрия", "+43"],
    ["Азербайджан", "+994"],
    ["Албания", "+355"],
    ["Алжир", "+213"],
    ["Ангола", "+244"],
    ["Андорра", "+376"],
    ["Антигуа и Барбуда", "+1268"],
    ["Аргентина", "+54"],
    ["Армения", "+374"],
    ["Афганистан", "+93"],
    ["Багамы", "+1242"],
    ["Бангладеш", "+880"],
    ["Барбадос", "+1246"],
    ["Бахрейн", "+973"],
    ["Беларусь", "+375"],
    ["Белиз", "+501"],
    ["Бельгия", "+32"],
    ["Бенин", "+229"],
    ["Болгария", "+359"],
    ["Боливия", "+591"],
    ["Босния и Герцеговина", "+387"],
    ["Ботсвана", "+267"],
    ["Бразилия", "+55"],
    ["Бруней", "673"],
    ["Буркина Фасо", "+226"],
    ["Бурунди", "+257"],
    ["Бутан", "+975"],
    ["Вануату", "+678"],
    ["Ватикан", "+39"],
    ["Великобритания", "+44"],
    ["Венгрия", "+36"],
    ["Венесуэла", "+58"],
    ["Восточный Тимор", "+670"],
    ["Вьетнам", "+84"],
    ["Габон", "+241"],
    ["Гаити", "+509"],
    ["Гайана", "+592"],
    ["Гамбия", "+220"],
    ["Гана", "+233"],
    ["Гватемала", "+502"],
    ["Гвинея", "+224"],
    ["Гвинея-Бисау", "+245"],
    ["Германия", "+49"],
    ["Гондурас", "+504"],
    ["Гренада", "+1473"],
    ["Греция", "+30"],
    ["Грузия", "+995"],
    ["Дания", "+45"],
    ["Джибути", "+253"],
    ["Доминика", "+1767"],
    ["Доминиканская Республика", "+1809"],
    ["Египет", "+20"],
    ["Замбия", "+260"],
    ["Зимбабве", "+263"],
    ["Израиль", "+972"],
    ["Индия", "+91"],
    ["Индонезия", "+62"],
    ["Иордания", "+962"],
    ["Ирак", "+964"],
    ["Иран", "+98"],
    ["Ирландия", "+353"],
    ["Исландия", "+354"],
    ["Испания", "+34"],
    ["Италия", "+39"],
    ["Йемен", "+967"],
    ["Кабо-Верде", "+238"],
    ["Казахстан", "+77"],
    ["Камбоджа", "+855"],
    ["Камерун", "+237"],
    ["Канада", "+1"],
    ["Катар", "+974"],
    ["Кения", "+254"],
    ["Кипр", "+357"],
    ["Киргизия", "+996"],
    ["Кирибати", "+686"],
    ["Китай", "+86"],
    ["Колумбия", "+57"],
    ["Коморы", "+269"],
    ["Республика Конго", "+243"],
    ["Конго, республика", "+242"],
    ["Коста-Рика", "+506"],
    ["Кот-д’Ивуар", "+225"],
    ["Куба", "+53"],
    ["Кувейт", "+965"],
    ["Лаос", "+856"],
    ["Латвия", "+371"],
    ["Лесото", "+266"],
    ["Либерия", "+231"],
    ["Ливан", "+961"],
    ["Ливия", "+218"],
    ["Литва", "+370"],
    ["Лихтенштейн", "+423"],
    ["Люксембург", "+352"],
    ["Маврикий", "+230"],
    ["Мавритания", "+222"],
    ["Мадагаскар", "+261"],
    ["Македония", "+389"],
    ["Малави", "+265"],
    ["Малайзия", "+60"],
    ["Мали", "+223"],
    ["Мальдивы", "+960"],
    ["Мальта", "+356"],
    ["Марокко", "+212"],
    ["Маршалловы Острова", "+692"],
    ["Мексика", "+52"],
    ["Мозамбик", "+259"],
    ["Молдавия", "+373"],
    ["Монако", "+377"],
    ["Монголия", "+976"],
    ["Мьянма", "+95"],
    ["Намибия", "+264"],
    ["Науру", "+674"],
    ["Непал", "+977"],
    ["Нигер", "+227"],
    ["Нигерия", "+234"],
    ["Нидерланды", "+31"],
    ["Никарагуа", "+505"],
    ["Новая Зеландия", "+64"],
    ["Норвегия", "+47"],
    ["Объединенные Арабские Эмираты", "+971"],
    ["Оман", "+968"],
    ["Пакистан", "+92"],
    ["Палау", "+680"],
    ["Панама", "+507"],
    ["Папуа - Новая Гвинея", "+675"],
    ["Парагвай", "+595"],
    ["Перу", "+51"],
    ["Польша", "+48"],
    ["Португалия", "+351"],
    ["Россия", "+7"],
    ["Руанда", "+250"],
    ["Румыния", "+40"],
    ["Сальвадор", "+503"],
    ["Самоа", "+685"],
    ["Сан-Марино", "+378"],
    ["Сан-Томе и Принсипи", "+239"],
    ["Саудовская Аравия", "+966"],
    ["Свазиленд", "+268"],
    ["Северная Корея", "+850"],
    ["Сейшелы", "+248"],
    ["Сенегал", "+221"],
    ["Сент-Китс и Невис", "+1869"],
    ["Сент-Люсия", "+1758"],
    ["Сербия", "+381"],
    ["Сингапур", "+65"],
    ["Сирия", "+963"],
    ["Словакия", "+421"],
    ["Словения", "+986"],
    ["Соединенные Штаты Америки", "+1"],
    ["Соломоновы Острова", "+677"],
    ["Сомали", "+252"],
    ["Судан", "+249"],
    ["Суринам", "+597"],
    ["Сьерра-Леоне", "+232"],
    ["Таджикистан", "+992"],
    ["Таиланд", "+66"],
    ["Танзания", "+255"],
    ["Того", "+228"],
    ["Тонга", "+676"],
    ["Тринидад и Тобаго", "+1868"],
    ["Тувалу", "+688"],
    ["Тунис", "+216"],
    ["Туркмения", "+993"],
    ["Турция", "+90"],
    ["Уганда", "+256"],
    ["Узбекистан", "+998"],
    ["Уругвай", "+598"],
    ["Фиджи", "+679"],
    ["Филиппины", "+63"],
    ["Финляндия", "+358"],
    ["Франция", "+33"],
    ["Хорватия", "+385"],
    ["Чад", "+235"],
    ["Черногория", "+381"],
    ["Чехия", "+420"],
    ["Чили", "+56"],
    ["Швейцария", "+41"],
    ["Швеция", "+46"],
    ["Шри-Ланка", "+94"],
    ["Эквадор", "+593"],
    ["Эритрея", "+291"],
    ["Эстония", "+372"],
    ["Эфиопия", "+251"],
    ["Южная Корея", "+82"],
    ["Ямайка", "+1876"],
    ["Япония", "+81"],
  ];
  const wrappers = Array.from(
    document.querySelectorAll(".name-phone > .wrapper")
  );

  wrappers.forEach((wrapper) => {
    const dropdown = document.createElement("ul");
    dropdown.className = "dropdown";

    array.forEach(([countryName, code]) => {
      const li = document.createElement("li");
      const row = document.createElement("div");
      const num = document.createElement("div");
      const country = document.createElement("div");

      row.className = "phoneMenuItem";
      num.className = "number-phone";
      country.className = "country-phone";
      num.textContent = code;
      country.textContent = countryName;

      row.append(num, country);
      li.appendChild(row);
      dropdown.appendChild(li);

      li.addEventListener("click", (event) => {
        event.stopPropagation();
        const phoneNumber = wrapper.querySelector(".phone-number");
        if (phoneNumber) phoneNumber.textContent = code;
        wrapper.classList.remove("active");
        const arrow = wrapper.querySelector(".arrow");
        if (arrow) arrow.classList.remove("rotate");
      });
    });

    wrapper.appendChild(dropdown);
  });

  document.addEventListener("click", () => {
    wrappers.forEach((wrapper) => wrapper.classList.remove("active"));
    document
      .querySelectorAll(".arrow")
      .forEach((arrow) => arrow.classList.remove("rotate"));
  });

  document.querySelectorAll(".arrow-img").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const wrapper = button.closest(".wrapper");
      if (!wrapper) return;
      const arrow = button.querySelector(".arrow");

      wrappers.forEach((item) => {
        if (item !== wrapper) item.classList.remove("active");
      });

      document.querySelectorAll(".arrow").forEach((item) => {
        if (item !== arrow) item.classList.remove("rotate");
      });

      wrapper.classList.toggle("active");
      if (arrow) arrow.classList.toggle("rotate");
    });
  });

  document.querySelectorAll(".border-input").forEach((borderInput) => {
    borderInput.addEventListener("click", (event) => {
      if (event.target.closest(".arrow-img")) return;
      event.stopPropagation();
      const wrapper = borderInput.closest(".wrapper");
      if (wrapper) wrapper.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  new Carousel(document.querySelector(".sl"), {
    type: "fade",
    loop: true,
    dots: true,
    autoplay: true,
    interval: 5500,
  });

  new Carousel(document.querySelector(".slider-pro"), {
    type: "track",
    loop: false,
    startIndex: 1,
    slidesToShow: 3,
    breakpoints: {
      1199: 1,
      991: 1,
      767: 1,
      575: 1,
    },
    dots: true,
    dotsBelow: 767,
    prev: document.querySelector(".prev"),
    next: document.querySelector(".next"),
    activeClassTarget: ".slider__item",
  });

  new Carousel(document.querySelector(".sl3"), {
    type: "track",
    loop: false,
    startIndex: 1,
    slidesToShow: 3,
    breakpoints: {
      991: 2,
      767: 1,
      575: 1,
    },
    dots: true,
    dotsBelow: 767,
    prev: document.querySelector(".slide3_prev"),
    next: document.querySelector(".slide3_next"),
  });

  initPhoneDropdown();
});
