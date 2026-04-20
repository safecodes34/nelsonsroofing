(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var mapEl = document.getElementById('oc-service-map');
  if (mapEl && typeof L !== 'undefined') {
    var ocCenter = [33.7175, -117.8311];

    var map = L.map(mapEl, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: false
    }).setView(ocCenter, 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    var ocCities = [
      { name: 'Anaheim', lat: 33.8366, lng: -117.9143 },
      { name: 'Santa Ana', lat: 33.7455, lng: -117.8677 },
      { name: 'Irvine', lat: 33.6846, lng: -117.8265 },
      { name: 'Huntington Beach', lat: 33.6595, lng: -118.0000 },
      { name: 'Newport Beach', lat: 33.6189, lng: -117.9298 },
      { name: 'Costa Mesa', lat: 33.6411, lng: -117.9187 },
      { name: 'Fullerton', lat: 33.8708, lng: -117.9294 },
      { name: 'Orange', lat: 33.7879, lng: -117.8531 },
      { name: 'Garden Grove', lat: 33.7743, lng: -117.9380 },
      { name: 'Mission Viejo', lat: 33.6, lng: -117.672 },
      { name: 'Laguna Beach', lat: 33.5427, lng: -117.7854 },
      { name: 'San Clemente', lat: 33.427, lng: -117.612 }
    ];

    function addCityMarkers(targetMap) {
      ocCities.forEach(function (city) {
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

    fetch('orange-county-ca.json')
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
        map.setView(ocCenter, 9);
        addCityMarkers(map);
      });
  }

  var whyCarouselVisibilityHandlers = [];

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
          titleEl.textContent = t;
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
})();
