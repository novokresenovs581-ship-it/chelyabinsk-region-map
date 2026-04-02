
window.openPlaceDrawer = function(name){
  const data = PLACE_SHOWCASE[name];
  if(!data) return;
  document.getElementById('drawerCover').src = data.cover;
  document.getElementById('drawerTitle').textContent = name;
  document.getElementById('drawerText').textContent = data.text;
  document.getElementById('drawerWhy').textContent = data.why;
  document.getElementById('drawerGallery').innerHTML = data.gallery.map(src => `<img src="${src}" alt="${name}">`).join('');
  document.getElementById('placeDrawer').classList.add('open');
  document.getElementById('placeDrawerBackdrop').classList.add('show');
};
window.closePlaceDrawer = function(){
  document.getElementById('placeDrawer').classList.remove('open');
  document.getElementById('placeDrawerBackdrop').classList.remove('show');
};
window.startExploration = function(){
  document.getElementById('mapSection').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>map.invalidateSize(), 300);
};
window.startTour = function(){
  let i = 0;
  const overlay = document.getElementById('tourOverlay');
  overlay.classList.add('show');
  function step(){
    if(i >= EXPEDITION.length) return;
    const item = EXPEDITION[i];
    map.flyTo(item.coords, item.zoom, {duration:1.5});
    document.getElementById('tourImage').src = item.image;
    document.getElementById('tourTitle').textContent = item.name;
    document.getElementById('tourText').textContent = item.text;
    document.getElementById('tourStep').textContent = `Шаг ${i+1} из ${EXPEDITION.length}`;
    document.getElementById('tourNextBtn').textContent = i === EXPEDITION.length - 1 ? 'Завершить' : 'Дальше';
    i++;
  }
  document.getElementById('tourNextBtn').onclick = ()=>{
    if(i >= EXPEDITION.length){ closeTour(); } else { step(); }
  };
  step();
};
window.closeTour = function(){
  document.getElementById('tourOverlay').classList.remove('show');
};

window.toggleTheme = function(){
  document.body.classList.toggle('theme-night');
  const isNight = document.body.classList.contains('theme-night');
  if(window.applyBasemap) applyBasemap(isNight);
  if(window.colorDistricts) colorDistricts();
  try{ localStorage.setItem('theme-mode', isNight ? 'night' : 'day'); }catch(e){}
};



window.objectMeta = function(item){
  const text = item.type.toLowerCase();
  let season = 'май — сентябрь';
  let format = 'поездка на 1 день';
  let level = 'лёгкий доступ';
  let fact = 'Одна из заметных точек Челябинской области.';
  if(text.includes('озеро') || text.includes('водохранилище')){
    season = 'июнь — сентябрь';
    format = 'отдых у воды / прогулка';
    level = 'лёгкий доступ';
    fact = 'Водные объекты региона — одна из самых сильных сторон туристической карты области.';
  } else if(text.includes('парк') || text.includes('заповедник') || text.includes('гора') || text.includes('хребет')){
    season = 'май — октябрь';
    format = 'поход / автопоездка';
    level = 'средний';
    fact = 'Горные и заповедные территории формируют образ Южного Урала как природного направления.';
  } else if(text.includes('истор')){
    season = 'круглый год';
    format = 'экскурсия / поездка';
    level = 'лёгкий доступ';
    fact = 'Исторические точки области делают карту не только природной, но и культурной.';
  } else if(text.includes('город') || text.includes('село')){
    season = 'круглый год';
    format = 'городская / районная поездка';
    level = 'лёгкий доступ';
    fact = 'Населённые пункты на карте помогают связать природные и исторические маршруты в одно путешествие.';
  }
  return {season, format, level, fact};
};

window.renderObjectCards = async function(){
  async function buildCards(containerId, items){
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    for(const item of items.slice(0, 12)){
      const images = await loadPhotos(item.name);
      const cover = images[0] || 'assets/taganay.PNG';
      const meta = objectMeta(item);
      const card = document.createElement('article');
      card.className = 'object-card';
      card.innerHTML = `
        <img src="${cover}" alt="${item.name}">
        <div class="object-card-body">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <div class="quick-stats">
            <div class="quick-chip">${item.type}</div>
            <div class="quick-chip">${meta.season}</div>
          </div>
          <div class="fact-note"><b>Факт:</b> ${meta.fact}</div>
          <div class="object-card-actions">
            <button class="primary" data-map="${item.name}">Показать на карте</button>
            <button class="secondary" data-info="${item.name}">Подробнее</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    }

    container.querySelectorAll('[data-map]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const item = [...APP_POINTS.cities, ...APP_POINTS.nature, ...APP_POINTS.history].find(x=>x.name===btn.dataset.map);
        if(item){
          document.getElementById('mapSection').scrollIntoView({behavior:'smooth'});
          setTimeout(()=> {
            map.flyTo(item.coords, 9.4, {duration:1.25});
            renderInfo(item);
          }, 250);
        }
      });
    });

    container.querySelectorAll('[data-info]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const item = [...APP_POINTS.cities, ...APP_POINTS.nature, ...APP_POINTS.history].find(x=>x.name===btn.dataset.info);
        if(item){
          renderInfo(item);
          document.getElementById('mapSection').scrollIntoView({behavior:'smooth'});
        }
      });
    });
  }

  await buildCards('citiesGrid', APP_POINTS.cities);
  await buildCards('natureGrid', APP_POINTS.nature);
  await buildCards('historyGrid', APP_POINTS.history);
};



document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('placeDrawerBackdrop').addEventListener('click', closePlaceDrawer);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closePlaceDrawer(); });

  try{
    if(localStorage.getItem('theme-mode') === 'night'){
      document.body.classList.add('theme-night');
    }
  }catch(e){}

  initMap();
  await renderObjectCards();

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('show'); });
  }, {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  const nav = document.getElementById('mainNav');
  function syncNav(){
    if(window.scrollY > window.innerHeight * 0.92){
      nav.classList.add('hidden-after-hero');
      nav.classList.remove('compact');
    }else if(window.scrollY > window.innerHeight * 0.45){
      nav.classList.remove('hidden-after-hero');
      nav.classList.add('compact');
    }else{
      nav.classList.remove('hidden-after-hero');
      nav.classList.remove('compact');
    }
  }
  window.addEventListener('scroll', syncNav, {passive:true});
  syncNav();
});
