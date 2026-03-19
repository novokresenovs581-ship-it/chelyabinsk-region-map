
window.map = null;
window.districtLayer = null;
window.pointLayers = null;
window.allPointItems = [];
window.districtMeta = [];

window.DISTRICT_INFO = {
  "Сосновский район": {center:"Долгодеревенское", population:"≈ 76 тыс. чел.", area:"≈ 2 113 км²", flora:"лесостепь, берёза, сосна, луговые травы", fauna:"косуля, лисица, заяц", famous:"Близость к Челябинску, сельские ландшафты и быстрый доступ к озёрам."},
  "Красноармейский район": {center:"Миасское", population:"≈ 40 тыс. чел.", area:"≈ 3 835 км²", flora:"степные луга, берёза, ива", fauna:"лисица, косуля, степные птицы", famous:"Крупная территория на востоке Челябинской агломерации."},
  "Аргаяшский район": {center:"Аргаяш", population:"≈ 38 тыс. чел.", area:"≈ 2 700 км²", flora:"лесостепь, сосна, берёза", fauna:"заяц, косуля, утки", famous:"Район с озёрами и сельскими ландшафтами."},
  "Саткинский район": {center:"Сатка", population:"≈ 80 тыс. чел.", area:"≈ 2 399 км²", flora:"ельники, пихта, горные луга", fauna:"медведь, лось, куница", famous:"Зюраткуль, горные маршруты и туристический потенциал."},
  "Троицкий район": {center:"Троицк", population:"≈ 25 тыс. чел.", area:"≈ 4 000 км²", flora:"степное разнотравье, ива, тополь", fauna:"суслик, заяц-русак, степные птицы", famous:"Южная степная территория у границы с Казахстаном."}
};

window.DISTRICT_FACTS = {
  "Сосновский район":"Один из районов, который сильнее всего связан с Челябинской агломерацией.",
  "Саткинский район":"Через район проходят ключевые природные маршруты к Зюраткулю и горной зоне Южного Урала.",
  "Аргаяшский район":"Территория района известна сочетанием озёр, лесостепи и сельских поселений.",
  "Красноармейский район":"Здесь находится село Миасское — важный районный центр восточной части области.",
  "Троицкий район":"Это одна из степных территорий области с историческим значением и южным характером ландшафта."
};

function popupHtml(item){
  return `
    <div class="popup-title">${item.name}</div>
    <div class="popup-row"><b>Тип:</b> ${item.type}</div>
    <div class="popup-row"><b>Население:</b> ${item.population}</div>
    <div class="popup-row"><b>Площадь:</b> ${item.area}</div>
    <div class="popup-row"><b>Флора:</b> ${item.flora}</div>
    <div class="popup-row"><b>Фауна:</b> ${item.fauna}</div>
    <div class="popup-row"><b>Описание:</b> ${item.description}</div>
  `;
}

function distKm(a,b){
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b[0]-a[0]);
  const dLon = toRad(b[1]-a[1]);
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const x = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

window.renderInfo = async function(item){
  const pool = [...APP_POINTS.cities, ...APP_POINTS.nature, ...APP_POINTS.history].filter(x => x.name !== item.name);
  const nearest = pool.map(x => ({...x, km: distKm(item.coords, x.coords)})).sort((a,b)=>a.km-b.km).slice(0,4);
  const selectedInfo = document.getElementById('selectedInfo');
  selectedInfo.innerHTML = `<h3>${item.name}</h3><div class="photo-empty">Загрузка фото и карточки объекта…</div>`;
  const images = await loadPhotos(item.name);

  selectedInfo.innerHTML = `
    <h3>${item.name}</h3>
    ${buildPhotoGallery(images, item.name)}
    <div class="quick-stats">
      <div class="quick-chip">${item.type}</div>
      <div class="quick-chip">${item.population}</div>
      <div class="quick-chip">${item.area}</div>
    </div>
    <div class="selected-grid" style="margin-top:14px;">
      <div class="selected-box">
        <b>Основная информация</b>
        <div>Тип: ${item.type}</div>
        <div style="margin-top:8px;">Население: ${item.population}</div>
        <div style="margin-top:8px;">Площадь: ${item.area}</div>
      </div>
      <div class="selected-box">
        <b>Природа и описание</b>
        <div>Флора: ${item.flora}</div>
        <div style="margin-top:8px;">Фауна: ${item.fauna}</div>
        <div style="margin-top:8px;">${item.description}</div>
      </div>
    </div>
    <div style="margin-top:14px;">
      <b>Что посмотреть рядом</b>
      <div class="nearby-list">
        ${nearest.map(n => `<div class="nearby-item" data-near="${n.name}"><strong>${n.name}</strong><br><span style="color:rgba(255,255,255,.68)">${n.type} • ${Math.round(n.km)} км</span></div>`).join('')}
      </div>
    </div>
  `;
  selectedInfo.querySelectorAll('[data-near]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const name = el.dataset.near;
      const found = [...APP_POINTS.cities, ...APP_POINTS.nature, ...APP_POINTS.history].find(x => x.name === name);
      if(found){
        map.flyTo(found.coords, 9, {duration:1.2});
        renderInfo(found);
      }
    });
  });
};

function addPoint(item, group, color, radius){
  const marker = L.circleMarker(item.coords,{
    radius, color, fillColor:color, fillOpacity:.92, weight:1.6
  }).bindPopup(popupHtml(item));
  marker.on('click', ()=>renderInfo(item));
  marker.addTo(group);
  let pulseState = false;
  setInterval(()=>{
    pulseState = !pulseState;
    marker.setStyle({radius: pulseState ? radius + 1.2 : radius});
  }, 1200);
  allPointItems.push(item);
}

function colorDistricts(){
  const paletteDay = ['#dff48d','#ffd88f','#b7f0a6','#9fe7ff','#ffb6a3','#cab8ff','#ffe99a','#a9f3e0'];
  const paletteNight = ['#7fe870','#63c7ff','#8eb4ff','#72e1c6','#ffd46b','#a1ff9c','#96e6ff','#c3d37b'];
  const isNight = document.body.classList.contains('theme-night');
  const palette = isNight ? paletteNight : paletteDay;
  districtLayer.eachLayer(layer=>{
    const name = (layer.feature.properties && (layer.feature.properties.NL_NAME_2 || layer.feature.properties.NAME_2)) || 'district';
    let h = 0;
    for(let i=0;i<name.length;i++) h = ((h<<5)-h)+name.charCodeAt(i);
    const fill = palette[Math.abs(h)%palette.length];
    layer.setStyle({
      color:isNight ? '#b9f6a6' : '#9ad24d',
      weight:2.4,
      opacity:1,
      fillColor:fill,
      fillOpacity:isNight ? .22 : .28
    });
  });
}

function renderSearch(q=''){
  q = q.trim().toLowerCase();
  const districts = districtMeta.filter(d => !q || d.name.toLowerCase().includes(q));
  const cities = APP_POINTS.cities.filter(i => !q || i.name.toLowerCase().includes(q));
  const nature = APP_POINTS.nature.filter(i => !q || i.name.toLowerCase().includes(q));
  const history = APP_POINTS.history.filter(i => !q || i.name.toLowerCase().includes(q));

  let out = '';
  if(districts.length){
    out += '<div class="section-title">Районы</div>' + districts.map(d => `<div class="district-item" data-kind="district" data-name="${d.name}"><strong>${d.name}</strong><span>${d.kind}</span></div>`).join('');
  }
  if(cities.length){
    out += '<div class="section-title">Города и сёла</div>' + cities.map(d => `<div class="district-item" data-kind="point" data-name="${d.name}"><strong>${d.name}</strong><span>${d.type}</span></div>`).join('');
  }
  if(nature.length){
    out += '<div class="section-title">Природа</div>' + nature.map(d => `<div class="district-item" data-kind="point" data-name="${d.name}"><strong>${d.name}</strong><span>${d.type}</span></div>`).join('');
  }
  if(history.length){
    out += '<div class="section-title">История</div>' + history.map(d => `<div class="district-item" data-kind="point" data-name="${d.name}"><strong>${d.name}</strong><span>${d.type}</span></div>`).join('');
  }
  const list = document.getElementById('districtList');
  list.innerHTML = out || '<div class="district-item"><strong>Ничего не найдено</strong><span>Попробуй другое название</span></div>';
  list.querySelectorAll('.district-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      const kind = item.dataset.kind;
      const name = item.dataset.name;
      list.querySelectorAll('.district-item').forEach(el=>el.classList.remove('active'));
      item.classList.add('active');
      if(kind === 'district'){
        const d = districtMeta.find(x => x.name === name);
        if(d){
          map.fitBounds(d.layer.getBounds(), {padding:[20,20], animate:true, duration:1});
          d.layer.openPopup();
        }
        return;
      }
      const found = allPointItems.find(x => x.name === name);
      if(found){
        map.flyTo(found.coords, 9, {duration:1.2});
        renderInfo(found);
      }
    });
  });
}
window.renderSearch = renderSearch;
window.colorDistricts = colorDistricts;

window.showLayer = function(type){
  Object.values(pointLayers).forEach(l => map.removeLayer(l));
  if(type === 'all'){
    pointLayers.cities.addTo(map);
    pointLayers.nature.addTo(map);
    pointLayers.history.addTo(map);
    districtLayer.addTo(map);
  } else if(type === 'districts'){
    districtLayer.addTo(map);
  } else if(type === 'cities'){
    pointLayers.cities.addTo(map); districtLayer.addTo(map);
  } else if(type === 'nature'){
    pointLayers.nature.addTo(map); districtLayer.addTo(map);
  } else if(type === 'history'){
    pointLayers.history.addTo(map); districtLayer.addTo(map);
  }
};

window.resetMapView = function(){
  map.setView([54.8,60.5],7);
  pointLayers.cities.addTo(map);
  pointLayers.nature.addTo(map);
  pointLayers.history.addTo(map);
  districtLayer.addTo(map);
};

window.focusCustomPoint = function(lat, lng, zoom=9){
  document.getElementById('mapSection').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>map.flyTo([lat,lng], zoom, {duration:1.2}), 300);
};

window.initMap = function(){
  map = L.map('map', {zoomControl:true, minZoom:6, maxZoom:10}).setView([54.8,60.5],7);

  window.dayTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'&copy; OpenStreetMap'});
  window.nightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution:'&copy; OpenStreetMap &copy; CARTO'});
  window.currentTiles = null;
  window.applyBasemap = function(night){
    if(window.currentTiles && map.hasLayer(window.currentTiles)) map.removeLayer(window.currentTiles);
    window.currentTiles = night ? window.nightTiles : window.dayTiles;
    window.currentTiles.addTo(map);
  };
  applyBasemap(document.body.classList.contains('theme-night'));

  districtLayer = L.layerGroup().addTo(map);
  pointLayers = {cities:L.layerGroup().addTo(map), nature:L.layerGroup().addTo(map), history:L.layerGroup().addTo(map)};

  APP_POINTS.cities.forEach(item => addPoint(item, pointLayers.cities, '#ffd93d', ['Челябинск','Магнитогорск','Златоуст','Миасс'].includes(item.name) ? 9 : 6));
  APP_POINTS.nature.forEach(item => addPoint(item, pointLayers.nature, '#4fd3ff', 6));
  APP_POINTS.history.forEach(item => addPoint(item, pointLayers.history, '#ffb14f', 6));

  fetch('districts.geojson')
    .then(r=>{ if(!r.ok) throw new Error('Не найден districts.geojson'); return r.json();})
    .then(geo=>{
      const geoJson = L.geoJSON(geo,{
        style:()=>({color:'#9ad24d',weight:2.4,fillColor:'#dff48d',fillOpacity:.28}),
        onEachFeature:(feature, layer)=>{
          const p = feature.properties || {};
          const raw = p.NL_NAME_2 || p.NAME_2 || 'Район';
          const name = String(raw).replace(/\([^)]*\)/g, '').replace(/\s+/g,' ').trim();
          const info = DISTRICT_INFO[name] || {center:'—', population:'—', area:'—', flora:'типичная флора района', fauna:'типичная фауна района', famous:'Район Челябинской области.'};
          layer.bindPopup(`<div class="popup-title">${name}</div><div class="popup-row"><b>Тип:</b> Район</div><div class="popup-row"><b>Центр:</b> ${info.center}</div><div class="popup-row"><b>Население:</b> ${info.population}</div><div class="popup-row"><b>Площадь:</b> ${info.area}</div><div class="popup-row"><b>Чем знаменит:</b> ${info.famous}</div>`);
          layer.on('click', ()=> {
            map.fitBounds(layer.getBounds(), {padding:[20,20], animate:true, duration:1});
            const fact = DISTRICT_FACTS[name] || 'Район Челябинской области со своими природными и культурными особенностями.';
            document.getElementById('selectedInfo').innerHTML = `
              <h3>${name}</h3>
              <div class="selected-grid">
                <div class="selected-box">
                  <b>Мини-энциклопедия района</b>
                  <div>Центр: ${info.center}</div>
                  <div style="margin-top:8px;">Население: ${info.population}</div>
                  <div style="margin-top:8px;">Площадь: ${info.area}</div>
                  <div style="margin-top:8px;">Чем знаменит: ${info.famous}</div>
                </div>
                <div class="selected-box">
                  <b>Природа и интересный факт</b>
                  <div>Флора: ${info.flora}</div>
                  <div style="margin-top:8px;">Фауна: ${info.fauna}</div>
                  <div style="margin-top:8px;"><b>Факт:</b> ${fact}</div>
                </div>
              </div>
            `;
          });
          districtMeta.push({name, layer, kind:'Район'});
        }
      });
      geoJson.eachLayer(l => districtLayer.addLayer(l));
      colorDistricts();
      renderSearch();
    })
    .catch(err=>{
      document.getElementById('selectedInfo').innerHTML = `<h3>Ошибка загрузки карты</h3><div class="selected-grid"><div class="selected-box"><b>Проблема</b><div>${err.message}</div></div><div class="selected-box"><b>Что сделать</b><div>Проверь, что файл districts.geojson лежит рядом с index.html</div></div></div>`;
    });

  document.getElementById('districtSearch').addEventListener('input', e => renderSearch(e.target.value));
  renderSearch();
};
