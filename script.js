/* ==========================================================================
   SAVE POINT — script.js
   Vanilla JS, no libraries. Loaded with `defer`, so the DOM is ready.

   1. Mobile navigation
   2. Gaming eras tabs (WAI-ARIA tabs pattern)
   3. "Suggest a missing game" form
   4. "Explore the Archive" click tracking hook
   5. Footer year
   ========================================================================== */

(function () {
  'use strict';

  // Let CSS know JavaScript is running (enables the collapsible mobile menu).
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  initNav();
  initEraTabs();
  initSuggestForm();
  initCtaTracking();
  setFooterYear();

  /* 1. Mobile navigation
     ------------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector('.site-nav__toggle');
    var menu = document.getElementById('primary-menu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a section.
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    // Close with Escape and return focus to the menu button.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when resizing up to the desktop layout.
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* 2. Gaming eras tabs
     Click a tab, or use Left/Right/Home/End once a tab has focus.
     ------------------------------------------------------------------------ */
  function initEraTabs() {
    var tablist = document.querySelector('.eras__tabs');
    if (!tablist) return;

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function selectTab(newTab, moveFocus) {
      tabs.forEach(function (tab) {
        var selected = tab === newTab;
        var panel = document.getElementById(tab.getAttribute('aria-controls'));

        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panel.hidden = !selected;

        if (selected) {
          // Retrigger the short image fade (skipped under reduced motion via CSS).
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      });

      if (moveFocus) newTab.focus();
    }

    tablist.addEventListener('click', function (event) {
      var tab = event.target.closest('[role="tab"]');
      if (tab) selectTab(tab, false);
    });

    tablist.addEventListener('keydown', function (event) {
      var index = tabs.indexOf(document.activeElement);
      if (index === -1) return;

      var next;
      switch (event.key) {
        case 'ArrowRight': next = tabs[(index + 1) % tabs.length]; break;
        case 'ArrowLeft':  next = tabs[(index - 1 + tabs.length) % tabs.length]; break;
        case 'Home':       next = tabs[0]; break;
        case 'End':        next = tabs[tabs.length - 1]; break;
        default: return;
      }

      event.preventDefault();
      selectTab(next, true);
    });
  }

  /* 3. "Suggest a missing game" form
     There is no backend yet, so we validate, then show a thank-you message.
     ------------------------------------------------------------------------ */
  function initSuggestForm() {
    var form = document.getElementById('suggest-form');
    var thanks = document.getElementById('suggest-thanks');
    var again = document.getElementById('suggest-again');
    if (!form || !thanks) return;

    var nameInput = form.elements.name;
    var emailInput = form.elements.email;
    var nameError = document.getElementById('suggest-name-error');
    var emailError = document.getElementById('suggest-email-error');
    var thanksName = document.getElementById('suggest-thanks-name');

    function setError(input, errorEl, message) {
      errorEl.textContent = message;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
    }

    function validate() {
      var firstInvalid = null;

      if (!nameInput.value.trim()) {
        setError(nameInput, nameError, 'Please tell us the name of the game or console you\'d like us to add.');
        firstInvalid = nameInput;
      } else {
        setError(nameInput, nameError, '');
      }

      var email = emailInput.value.trim();
      if (email && !emailInput.checkValidity()) {
        setError(emailInput, emailError, 'That email doesn\'t look quite right. Check it, or leave it blank.');
        firstInvalid = firstInvalid || emailInput;
      } else {
        setError(emailInput, emailError, '');
      }

      return firstInvalid;
    }

    // Clear an error as soon as the visitor fixes it.
    nameInput.addEventListener('input', function () {
      if (nameInput.value.trim()) setError(nameInput, nameError, '');
    });
    emailInput.addEventListener('blur', function () {
      if (!emailInput.value.trim() || emailInput.checkValidity()) setError(emailInput, emailError, '');
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstInvalid = validate();
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var data = {
        name: nameInput.value.trim(),
        note: form.elements.note.value.trim(),
        email: emailInput.value.trim()
      };

      /* ------------------------------------------------------------------
         TODO: CONNECT A REAL FORM SERVICE HERE
         Send `data` to Formspree, Netlify Forms, Basin, or your own
         endpoint, then show the thank-you message once it succeeds:

         fetch('https://formspree.io/f/YOUR_FORM_ID', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
           body: JSON.stringify(data)
         }).then(function (res) { if (res.ok) showThanks(data.name); });
         ------------------------------------------------------------------ */
      showThanks(data.name);
    });

    function showThanks(name) {
      thanksName.textContent = '“' + name + '”';
      form.hidden = true;
      thanks.hidden = false;
      thanks.querySelector('h3').focus();
    }

    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        thanks.hidden = true;
        form.hidden = false;
        nameInput.focus();
      });
    }
  }

  /* 4. "Explore the Archive" click tracking hook
     Every primary CTA has data-cta="explore-archive".
     ------------------------------------------------------------------------ */
  function initCtaTracking() {
    document.addEventListener('click', function (event) {
      var cta = event.target.closest('[data-cta]');
      if (!cta) return;

      var location = cta.closest('header, section, footer');
      var placement = location ? (location.id || location.className.split(' ')[0]) : 'unknown';

      // TODO: send this to your analytics tool, for example:
      //   gtag('event', 'cta_click', { cta: cta.dataset.cta, placement: placement });
      //   plausible('Explore Archive', { props: { placement: placement } });
      if (window.console) console.info('[Save Point] CTA click:', cta.dataset.cta, 'from', placement);

      // The archive link is "#" for now; stop the jump to the top of the page.
      if (cta.getAttribute('href') === '#') event.preventDefault();
    });
  }

  /* 5. Footer year
     ------------------------------------------------------------------------ */
  function setFooterYear() {
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }
})();
