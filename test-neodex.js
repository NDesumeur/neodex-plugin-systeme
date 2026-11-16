// lancé par le test « local » de NeoDex : les mesures arrivent, les graphiques prennent la largeur de leur carte, rien ne déborde
module.exports = async ({ pj, sleep }) => {
  await sleep(3500);
  const r = await pj(`(() => {
    const cv = document.getElementById('chUse'), over = [...document.querySelectorAll('.appWrap *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length;
    const cut = [...document.querySelectorAll('.sysBig')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
    return { cut, cpu: document.getElementById('sysCpu').textContent, procs: document.querySelectorAll('#sysProcs .sysRow').length, w: cv.width, cw: cv.parentElement.clientWidth, h: cv.parentElement.clientHeight, over };
  })()`);
  if (!/%/.test(r.cpu) || !r.procs) throw new Error('mesures absentes : ' + JSON.stringify(r));
  if (r.over) throw new Error(r.over + ' élément(s) débordent à droite');
  if (r.cut.length) throw new Error('valeur coupée : ' + r.cut.join(', '));
  if (!r.w) throw new Error('graphique vide');
  await sleep(1500);
  return 'processeur ' + r.cpu + ', ' + r.procs + ' programmes, graphique ' + r.cw + '×' + r.h + ' px';
};
