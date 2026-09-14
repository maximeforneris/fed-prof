/* Bilan de niveau : des questions à choix, rangées par famille et par étage.
 *
 *   <div class="diag" data-famille="Médias et réseaux" data-etage="bts" data-bonne="0">
 *     <p class="enonce">…</p>
 *     <ol><li><button type="button">…</button></li>…</ol>
 *     <p class="retour" hidden>…pourquoi…</p>
 *   </div>
 *
 * data-etage vaut « bts » (ce qu'un examinateur demande) ou « prof » (la question
 * d'étudiant qui déstabilise). data-bonne est le rang, à partir de 0, de la bonne
 * réponse dans la source ; les choix sont mélangés au chargement.
 *
 * Un bilan mesure, il ne s'entraîne pas : **le premier choix compte, et il est
 * définitif**. Un bouton « Je ne sais pas » est ajouté à chaque question ; il
 * compte à part, parce qu'un blanc assumé n'est pas une erreur.
 *
 * Un élément #releve reçoit le tableau par famille, mis à jour à chaque réponse,
 * et un bouton qui copie le relevé en texte, pour le coller dans la conversation.
 * Rien n'est enregistré : la page rechargée repart de zéro.
 */
(function () {
  "use strict";

  function melanger(t) {
    for (var i = t.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = t[i]; t[i] = t[j]; t[j] = x;
    }
    return t;
  }

  var questions = Array.prototype.slice.call(document.querySelectorAll(".diag"));
  var familles = [];
  questions.forEach(function (q) {
    var f = q.getAttribute("data-famille");
    if (familles.indexOf(f) < 0) familles.push(f);
  });

  function etat(q) { return q.getAttribute("data-etat") || ""; }

  function releve() {
    var boite = document.getElementById("releve");
    if (!boite) return;
    var lignes = familles.map(function (f) {
      var r = { bts: [0, 0], prof: [0, 0], nsp: 0, faites: 0, total: 0 };
      questions.forEach(function (q) {
        if (q.getAttribute("data-famille") !== f) return;
        var e = q.getAttribute("data-etage");
        r.total++;
        r[e][1]++;
        var s = etat(q);
        if (s) r.faites++;
        if (s === "juste") r[e][0]++;
        if (s === "nsp") r.nsp++;
      });
      return { f: f, r: r };
    });
    var faites = questions.filter(function (q) { return etat(q); }).length;
    var html = "<table><thead><tr><th>Famille</th><th>Étage BTS</th><th>Étage professeur</th>" +
      "<th>Je ne sais pas</th></tr></thead><tbody>";
    lignes.forEach(function (l) {
      var fini = l.r.faites === l.r.total;
      html += "<tr" + (fini ? "" : " class=\"en-cours\"") + "><td>" + l.f + "</td><td>" +
        l.r.bts[0] + " / " + l.r.bts[1] + "</td><td>" + l.r.prof[0] + " / " + l.r.prof[1] +
        "</td><td>" + l.r.nsp + "</td></tr>";
    });
    html += "</tbody></table><p class=\"avancement\">" + faites + " questions sur " +
      questions.length + " — une famille grisée n'est pas terminée.</p>" +
      "<button type=\"button\" class=\"copier\">Copier le relevé</button>" +
      "<p class=\"copie-ok\" hidden>Relevé copié : collez-le dans la conversation.</p>";
    boite.innerHTML = html;
    boite.querySelector(".copier").addEventListener("click", function () {
      var d = new Date();
      var txt = "Bilan domotique, " + d.toLocaleDateString("fr-FR") + " — " + faites + "/" +
        questions.length + " questions\n";
      lignes.forEach(function (l) {
        txt += "- " + l.f + " : BTS " + l.r.bts[0] + "/" + l.r.bts[1] + ", professeur " +
          l.r.prof[0] + "/" + l.r.prof[1] + ", je ne sais pas " + l.r.nsp + "\n";
      });
      txt += "Questions manquées : ";
      var ratees = questions.filter(function (q) { return etat(q) === "faux" || etat(q) === "nsp"; })
        .map(function (q) { return q.getAttribute("data-num") + (etat(q) === "nsp" ? " (?)" : ""); });
      txt += (ratees.length ? ratees.join(", ") : "aucune") + "\n";
      var ok = boite.querySelector(".copie-ok");
      function fait() { ok.hidden = false; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(fait, function () { secours(txt); fait(); });
      } else { secours(txt); fait(); }
    });
  }

  function secours(txt) {
    var t = document.createElement("textarea");
    t.value = txt; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) { /* on laisse le texte visible */ }
    document.body.removeChild(t);
  }

  function clore(q, s) {
    q.setAttribute("data-etat", s);
    q.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
    var r = q.querySelector(".retour");
    if (r) r.hidden = false;
    releve();
  }

  questions.forEach(function (q, n) {
    q.setAttribute("data-num", "Q" + (n + 1));
    var ol = q.querySelector("ol");
    var items = Array.prototype.slice.call(ol.children);
    var bonne = items[parseInt(q.getAttribute("data-bonne"), 10)];
    melanger(items).forEach(function (li) { ol.appendChild(li); });
    items.forEach(function (li) {
      li.querySelector("button").addEventListener("click", function () {
        if (etat(q)) return;
        var juste = li === bonne;
        li.classList.add(juste ? "juste" : "faux");
        if (!juste) bonne.classList.add("attendue");
        clore(q, juste ? "juste" : "faux");
      });
    });
    var nsp = document.createElement("button");
    nsp.type = "button"; nsp.className = "nsp"; nsp.textContent = "Je ne sais pas";
    nsp.addEventListener("click", function () {
      if (etat(q)) return;
      bonne.classList.add("attendue");
      clore(q, "nsp");
    });
    ol.insertAdjacentElement("afterend", nsp);
  });

  releve();
})();
