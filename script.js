(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var mapEl = document.getElementById('wc-service-map');
  if (mapEl && typeof L !== 'undefined') {
    var wcCenter = [41.12, -73.7949];

    var map = L.map(mapEl, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: false
    }).setView(wcCenter, 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    var wcCities = [
      { name: 'White Plains', lat: 41.034, lng: -73.7629 },
      { name: 'Yonkers', lat: 40.9312, lng: -73.8987 },
      { name: 'New Rochelle', lat: 40.9115, lng: -73.7824 },
      { name: 'Mount Vernon', lat: 40.9126, lng: -73.8371 },
      { name: 'Peekskill', lat: 41.2901, lng: -73.9204 },
      { name: 'Ossining', lat: 41.1629, lng: -73.8615 },
      { name: 'Harrison', lat: 40.969, lng: -73.7126 },
      { name: 'Rye', lat: 40.9807, lng: -73.6837 },
      { name: 'Scarsdale', lat: 40.9793, lng: -73.7775 },
      { name: 'Tarrytown', lat: 41.0762, lng: -73.8587 },
      { name: 'Yorktown', lat: 41.2707, lng: -73.7776 },
      { name: 'Cortlandt', lat: 41.17, lng: -73.894 }
    ];

    function addCityMarkers(targetMap) {
      wcCities.forEach(function (city) {
        L.circleMarker([city.lat, city.lng], {
          radius: 5,
          stroke: true,
          weight: 2,
          color: '#ffffff',
          opacity: 1,
          fillColor: '#16a34a',
          fillOpacity: 0.92
        }).addTo(targetMap);
      });
    }

    fetch('westchester-county-ny.json')
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var layer = L.geoJSON(data, {
          style: function () {
            return {
              color: '#b91c1c',
              weight: 2.5,
              opacity: 1,
              fill: true,
              fillColor: '#dc2626',
              fillOpacity: 0.28,
              lineJoin: 'round',
              lineCap: 'round'
            };
          }
        }).addTo(map);

        addCityMarkers(map);

        var b = layer.getBounds();
        map.fitBounds(b, { padding: [20, 24] });
      })
      .catch(function () {
        map.setView(wcCenter, 9);
        addCityMarkers(map);
      });
  }

  var whyCarouselVisibilityHandlers = [];

  function setWhyCarouselTitle(titleEl, raw) {
    if (!titleEl || raw == null) return;
    var parts = String(raw).split('||');
    if (parts.length >= 2) {
      titleEl.textContent = '';
      var s1 = document.createElement('span');
      s1.className = 'why-carousel-title__row';
      s1.textContent = parts[0].trim();
      var s2 = document.createElement('span');
      s2.className = 'why-carousel-title__row';
      s2.textContent = parts.slice(1).join('||').trim();
      titleEl.appendChild(s1);
      titleEl.appendChild(s2);
    } else {
      titleEl.textContent = raw;
    }
  }

  function initWhyCarousel(carouselRoot) {
    var slides = carouselRoot.querySelectorAll('.why-carousel-slide');
    var titleEl = carouselRoot.querySelector('.why-carousel-title');
    var bulletGroups = carouselRoot.querySelectorAll('[data-carousel-bullets]');
    var dots = carouselRoot.querySelectorAll('.why-carousel-dot[data-carousel-go]');
    var slideCount = slides.length;
    var current = 0;
    var timerId = null;
    var intervalMs = parseInt(carouselRoot.getAttribute('data-carousel-interval'), 10);
    if (isNaN(intervalMs) || intervalMs < 2000) {
      intervalMs = 5500;
    }

    var prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function goTo(index) {
      if (!slideCount) return;
      var next = ((index % slideCount) + slideCount) % slideCount;
      current = next;

      slides.forEach(function (slide, i) {
        var active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      if (titleEl) {
        var activeSlide = slides[current];
        var t = activeSlide && activeSlide.getAttribute('data-carousel-title');
        if (t) {
          setWhyCarouselTitle(titleEl, t);
        }
      }

      bulletGroups.forEach(function (group) {
        var idx = parseInt(group.getAttribute('data-carousel-bullets'), 10);
        if (isNaN(idx)) return;
        var active = idx === current;
        group.classList.toggle('is-active', active);
        group.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      dots.forEach(function (dot, i) {
        var active = i === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
        dot.setAttribute('tabindex', active ? '0' : '-1');
      });
    }

    function schedule() {
      clearInterval(timerId);
      if (prefersReduced || slideCount < 2) return;
      timerId = window.setInterval(function () {
        goTo(current + 1);
      }, intervalMs);
    }

    function pauseAutoplay() {
      clearInterval(timerId);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-carousel-go'), 10);
        if (!isNaN(idx)) {
          goTo(idx);
          schedule();
        }
      });
    });

    var swipeViewport = carouselRoot.querySelector('.why-carousel-viewport');
    if (swipeViewport && slideCount > 1) {
      var swipeStartX = 0;
      var swipeStartY = 0;
      var swipeTracking = false;

      swipeViewport.addEventListener(
        'touchstart',
        function (e) {
          if (e.touches.length !== 1) return;
          swipeTracking = true;
          swipeStartX = e.touches[0].clientX;
          swipeStartY = e.touches[0].clientY;
        },
        { passive: true }
      );

      swipeViewport.addEventListener(
        'touchend',
        function (e) {
          if (!swipeTracking) return;
          swipeTracking = false;
          if (!e.changedTouches.length) return;
          var endX = e.changedTouches[0].clientX;
          var endY = e.changedTouches[0].clientY;
          var dx = endX - swipeStartX;
          var dy = endY - swipeStartY;
          var minSwipe = 48;
          if (Math.abs(dx) < minSwipe) return;
          if (Math.abs(dx) <= Math.abs(dy)) return;
          if (dx < 0) {
            goTo(current + 1);
          } else {
            goTo(current - 1);
          }
          schedule();
        },
        { passive: true }
      );

      swipeViewport.addEventListener(
        'touchcancel',
        function () {
          swipeTracking = false;
        },
        { passive: true }
      );
    }

    carouselRoot.addEventListener('mouseenter', pauseAutoplay);
    carouselRoot.addEventListener('mouseleave', schedule);

    carouselRoot.addEventListener('focusin', pauseAutoplay);
    carouselRoot.addEventListener('focusout', function (e) {
      if (!carouselRoot.contains(e.relatedTarget)) {
        schedule();
      }
    });

    whyCarouselVisibilityHandlers.push({ pause: pauseAutoplay, resume: schedule });

    goTo(0);
    schedule();
  }

  document.querySelectorAll('.why-residential-carousel').forEach(initWhyCarousel);

  if (whyCarouselVisibilityHandlers.length) {
    document.addEventListener('visibilitychange', function () {
      whyCarouselVisibilityHandlers.forEach(function (h) {
        if (document.hidden) {
          h.pause();
        } else {
          h.resume();
        }
      });
    });
  }

  function isLeafletMapImage(img) {
    return !!(img && img.closest && img.closest('.leaflet-container'));
  }

  function lockSiteImages() {
    document.querySelectorAll('img').forEach(function (img) {
      if (isLeafletMapImage(img)) return;
      img.setAttribute('draggable', 'false');
    });

    function blockIfSiteImage(e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && !isLeafletMapImage(t)) {
        e.preventDefault();
      }
    }

    document.addEventListener('contextmenu', blockIfSiteImage, true);
    document.addEventListener('dragstart', blockIfSiteImage, true);
    document.addEventListener(
      'auxclick',
      function (e) {
        if (e.button === 1 && e.target.tagName === 'IMG' && !isLeafletMapImage(e.target)) {
          e.preventDefault();
        }
      },
      true
    );
  }

  lockSiteImages();
})();
