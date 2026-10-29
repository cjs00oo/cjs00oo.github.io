// 나눔 보내기 — 새 Apps Script 웹 앱(받기 전용 시트)으로 보낸다.
// ENDPOINT 는 섭이 웹 앱을 배포한 뒤 받은 주소(…/exec)를 넣는다. 비어 있으면 미리보기 모드.
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzkExK4OZD1vBg5TJUDmNFwQ1CtVDIQaGuid9ulKiyYBGye7pMw274cSncFTin_796EnA/exec';

  var form = document.getElementById('share-form');
  if (!form) return;
  var done = document.getElementById('share-done');
  var err = document.getElementById('share-err');
  var send = form.querySelector('button.send');
  var opened = Date.now();
  // 어디서 왔는지 (릴스 링크에 ?from=reels 를 붙이면 시트에 남는다)
  var from = (location.search.match(/[?&](?:from|utm_source)=([^&]+)/) || [])[1] || '';
  try { from = decodeURIComponent(from).slice(0, 40); } catch (e) { from = ''; }

  // 글자 수
  Array.prototype.forEach.call(document.querySelectorAll('[data-count-for]'), function (el) {
    var ta = document.getElementById(el.getAttribute('data-count-for'));
    var up = function () { el.textContent = ta.value.length; };
    ta.addEventListener('input', up); up();
  });

  function v(name) { return (form.elements[name].value || '').trim(); }
  function showErr(msg) { err.innerHTML = msg; err.hidden = false; }

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var missing = ['nick', 'tried'].filter(function (n) { return !v(n); });
    missing.forEach(function (n) { form.elements[n].setAttribute('aria-invalid', 'true'); });
    if (missing.length) {
      showErr(missing.length === 2 ? '닉네임과 해 본 것을 적어 주세요.' : missing[0] === 'nick' ? '닉네임을 적어 주세요.' : '해 본 것을 적어 주세요.');
      form.elements[missing[0]].focus();
      return;
    }
    // 「실려도 괜찮아요」를 안 켰으면 한 번 물어본다 (섭 결정 N4 · 10/29)
    if (!form.elements.consent.checked) { openAsk(); return; }
    sendNow();
  });

  var ask = document.getElementById('share-ask');
  function openAsk() { ask.hidden = false; ask.querySelector('.ask-card').focus(); }
  function closeAsk() { ask.hidden = true; }
  document.getElementById('ask-yes').addEventListener('click', function () { form.elements.consent.checked = true; closeAsk(); sendNow(); });
  document.getElementById('ask-no').addEventListener('click', function () { closeAsk(); sendNow(); });
  ask.addEventListener('click', function (e) { if (e.target === ask) { closeAsk(); send.focus(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ask.hidden) { closeAsk(); send.focus(); } });

  function sendNow() {
    var data = {
      nick: v('nick').slice(0, 20), tried: v('tried').slice(0, 2000),
      verse: v('verse').slice(0, 100), more: v('more').slice(0, 1000),
      consent: form.elements.consent.checked, website: form.elements.website.value,
      elapsed: Date.now() - opened, from: from
    };
    if (!ENDPOINT) { // 미리보기: 실제로 보내지 않는다
      finish();
      return;
    }
    send.disabled = true; send.textContent = '보내는 중…';
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) finish();
        else showErr(res && res.error === 'busy' ? '지금 보내는 분이 많아요. 잠시 뒤 다시 보내 주세요.' : '보내지 못했어요. 잠시 뒤 다시 보내 주세요.');
      })
      .catch(function () { showErr('보내지 못했어요. 인터넷 연결을 확인하고 다시 보내 주세요.'); })
      .then(function () { send.disabled = false; send.textContent = '보내기'; });
  }

  function finish() {
    form.hidden = true; done.hidden = false;
    done.focus({ preventScroll: true });
    document.querySelector('.share-box').scrollIntoView({ block: 'start' });
  }
  document.getElementById('share-again').addEventListener('click', function () {
    form.reset();
    Array.prototype.forEach.call(document.querySelectorAll('[data-count-for]'), function (el) { el.textContent = '0'; });
    opened = Date.now();
    done.hidden = true; form.hidden = false; form.elements.nick.focus();
  });
})();
