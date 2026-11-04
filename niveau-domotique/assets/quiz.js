/* Composants de rappel communs aux leçons.
 *
 * 1. Question à choix :
 *    <div class="qcm" data-bonne="0">
 *      <p class="enonce">…</p>
 *      <ol><li><button type="button">…</button><p class="retour" hidden>…</p></li>…</ol>
 *    </div>
 *    data-bonne = rang (à partir de 0) de la bonne réponse dans la source. Les choix sont
 *    mélangés au chargement : la place ne trahit rien. Un clic dit juste ou faux et donne
 *    la raison propre à ce choix ; on peut en essayer un autre.
 *    Un élément .bilan[data-pour="qcm"] reçoit « premiers essais justes : n / N ».
 *
 * 2. Rappel libre, auto-évalué :
 *    <div class="rappel">
 *      <label class="consigne">…</label><textarea></textarea>
 *      <button class="comparer" type="button">Comparer</button>
 *      <div class="modele" hidden>… <ul class="bareme"><li><label><input type="checkbox" data-points="1"> …</label></li></ul>
 *      <p class="total"></p></div>
 *    </div>
 *    On écrit d'abord, on compare ensuite. Rien n'est enregistré.
 *
 * 3. Schéma à légender :
 *    <div class="legende" data-choix="vanne n° 15|té de mélange|…">
 *      <ol><li><span class="lettre">A</span><select data-bonne="vanne n° 15" aria-label="A"></select>
 *        <p class="retour" hidden>indice si faux</p></li>…</ol>
 *      <button class="verifier" type="button">Vérifier</button><p class="total"></p>
 *    </div>
 *    Les mêmes choix, dans le même ordre, pour chaque lettre : l'ordre ne trahit rien.
 *    Vérifier marque chaque lettre et donne l'indice des seules lettres fausses.
 */
(function () {
  "use strict";

  function melange(liste) {
    for (var i = liste.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = liste[i]; liste[i] = liste[j]; liste[j] = t;
    }
    return liste;
  }

  var qcms = Array.prototype.slice.call(document.querySelectorAll(".qcm"));
  var premiers = { justes: 0, faits: 0 };

  function bilan() {
    var b = document.querySelector('.bilan[data-pour="qcm"]');
    if (!b) return;
    b.textContent = premiers.faits
      ? "Premiers essais justes : " + premiers.justes + " / " + qcms.length +
        (premiers.faits < qcms.length ? " (" + (qcms.length - premiers.faits) + " à faire)" : "")
      : "";
  }

  qcms.forEach(function (q) {
    var ol = q.querySelector("ol");
    var items = Array.prototype.slice.call(ol.children);
    var bonne = parseInt(q.getAttribute("data-bonne"), 10);
    items.forEach(function (li, i) { li.dataset.ok = i === bonne ? "1" : "0"; });
    melange(items).forEach(function (li) { ol.appendChild(li); });

    var dejaFait = false;
    items.forEach(function (li) {
      var btn = li.querySelector("button");
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () {
        var ok = li.dataset.ok === "1";
        li.classList.remove("juste", "faux");
        li.classList.add(ok ? "juste" : "faux");
        btn.setAttribute("aria-pressed", "true");
        var r = li.querySelector(".retour");
        if (r) r.hidden = false;
        if (!dejaFait) {
          dejaFait = true;
          premiers.faits++;
          if (ok) premiers.justes++;
          bilan();
        }
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".rappel"), function (r) {
    var btn = r.querySelector("button.comparer");
    var modele = r.querySelector(".modele");
    var total = r.querySelector(".total");
    var cases = Array.prototype.slice.call(r.querySelectorAll('.bareme input[type="checkbox"]'));
    var max = cases.reduce(function (s, c) { return s + (parseFloat(c.dataset.points) || 0); }, 0);

    function compte() {
      if (!total) return;
      var s = cases.reduce(function (a, c) { return a + (c.checked ? parseFloat(c.dataset.points) || 0 : 0); }, 0);
      total.textContent = "Ce que votre réponse obtiendrait : " + s + " / " + max + " point" + (max > 1 ? "s" : "");
    }
    cases.forEach(function (c) { c.addEventListener("change", compte); });

    btn.addEventListener("click", function () {
      var t = r.querySelector("textarea");
      if (t && !t.value.trim()) {
        t.focus();
        t.placeholder = "Écrivez d'abord, même trois mots : c'est l'effort de rappel qui fixe.";
        return;
      }
      modele.hidden = false;
      btn.hidden = true;
      compte();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".legende"), function (L) {
    var choix = (L.getAttribute("data-choix") || "").split("|");
    var selects = Array.prototype.slice.call(L.querySelectorAll("select"));
    selects.forEach(function (s) {
      var vide = document.createElement("option");
      vide.value = ""; vide.textContent = "—";
      s.appendChild(vide);
      choix.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c; o.textContent = c;
        s.appendChild(o);
      });
    });
    var btn = L.querySelector("button.verifier");
    var total = L.querySelector(".total");
    btn.addEventListener("click", function () {
      var n = 0;
      selects.forEach(function (s) {
        var li = s.closest("li");
        var ok = s.value === s.getAttribute("data-bonne");
        li.classList.remove("juste", "faux");
        if (s.value) li.classList.add(ok ? "juste" : "faux");
        var r = li.querySelector(".retour");
        if (r) r.hidden = ok || !s.value;
        if (ok) n++;
      });
      total.textContent = n + " / " + selects.length + " justes" +
        (n === selects.length ? " : la boucle est lue." : " : reprenez les lettres marquées, l'indice dit où regarder.");
    });
  });
})();
