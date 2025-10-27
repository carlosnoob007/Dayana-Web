// Carrusel infinito y continuo
(function(){
    const container = document.querySelector('.contenido-carrusel');
    if (!container) return;
    if (container.dataset.carouselInit) return;
    container.dataset.carouselInit = '1';

    const getMarginRight = el => {
        const m = getComputedStyle(el).marginRight;
        return m ? parseFloat(m) : 0;
    };

    // obtener las slides "originales" (antes de clonar)
    let originals = Array.from(container.querySelectorAll('.imagen'));
    if (!originals.length) return;

    // espera a que todas las imágenes originales carguen
    const imagesLoaded = imgs => Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
        return new Promise(resolve => img.addEventListener('load', resolve, { once: true }));
    }));

    imagesLoaded(originals).then(() => {
        // calcular ancho total de las slides originales (incluye margin-right)
        let originalsWidth = originals.reduce((sum, el) => {
            return sum + el.getBoundingClientRect().width + getMarginRight(el);
        }, 0);

        // clonar las slides y añadir al final para secuencia repetida
        originals.forEach(s => container.appendChild(s.cloneNode(true)));

        // optimizaciones visuales y estilo
        container.style.willChange = 'transform';
        container.style.display = container.style.display || 'flex';

        // variables de animación
        const speed = 60;
        let px = 0;
        let paused = false;
        let lastTs = null;

        // pausa al hover / touch
        container.addEventListener('mouseenter', () => paused = true);
        container.addEventListener('mouseleave', () => { paused = false; lastTs = null; });
        container.addEventListener('touchstart', () => paused = true, { passive: true });
        container.addEventListener('touchend', () => { paused = false; lastTs = null; }, { passive: true });

        // recalcular originalsWidth si cambia el tamaño de ventana
        function recalc() {
            originals = Array.from(container.querySelectorAll('.imagen')).slice(0, originals.length); // primeros N originales
            originalsWidth = originals.reduce((sum, el) => {
                return sum + el.getBoundingClientRect().width + getMarginRight(el);
            }, 0);
            // mantener px en rango para evitar saltos
            px = px % originalsWidth;
        }
        window.addEventListener('resize', () => {
            // debounce mínimo
            clearTimeout(window.__carouselResizeTimer);
            window.__carouselResizeTimer = setTimeout(recalc, 120);
        });

        function step(ts){
            if (paused) {
                lastTs = ts;
                requestAnimationFrame(step);
                return;
            }
            if (lastTs == null) lastTs = ts;
            const dt = (ts - lastTs) / 1000;
            lastTs = ts;

            px += speed * dt;
            if (originalsWidth > 0 && px >= originalsWidth) {
                px = px % originalsWidth;
            }
            container.style.transform = `translateX(-${px}px)`;
            requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }).catch(err => {
        // si alguna imagen falla, aún intentamos inicializar con lo que haya
        console.warn('Carousel: error cargando imágenes', err);
    });
})();