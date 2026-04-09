const params = new URLSearchParams(window.location.search);
const invitadoId = params.get('invitado') || params.get('id') || 'general';
const nombreViaURL = params.get('n');
const pasesViaURL = params.get('p');
const tipoViaURL = params.get('t');

const STORAGE_RSVP_KEY = 'boda_rsvp_confirmaciones';
const STORAGE_RSVP_CHANGES_KEY = 'boda_rsvp_cambios';
const STORAGE_GUESTS_KEY = 'boda_invitados_locales';

let invitadoActual = {
    id: 'general',
    nombre: 'Invitado',
    pases: 1,
    tipo: 'familia'
};

const SCHEDULE = [
  { id: '1', title: 'Ceremonia Religiosa', time: '12:00 PM', location: 'Templo de San Mateo', image: 'https://github.com/Dann97/nuestrabodalj.github.io/blob/main/assets/CeremoniaReligiosa.jpeg?raw=true', description: 'Acompáñanos en este momento sagrado en el Templo de San Mateo, Capulálpam de Méndez.' },
  { id: '2', title: 'Calenda', time: '01:30 PM', location: 'Calles de Capulálpam', image: 'https://github.com/Dann97/nuestrabodalj.github.io/blob/main/assets/Calenda.jpeg?raw=true', description: 'Partiremos del templo terminada la misa camino al lugar de la fiesta. ¡Música y alegría por las calles!' },
  { id: '3', title: 'Recepción', time: '02:00 PM', location: 'Cabañas Capulálpam', image: 'https://github.com/Dann97/nuestrabodalj.github.io/blob/main/assets/Recepcion.jpeg?raw=true', description: 'Brindemos por el amor en las hermosas Cabañas Capulálpam.' },
  { id: '4', title: 'Fiesta', time: '03:00 PM', location: 'Cabañas de Capulálpam', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop', description: 'Espacio al aire libre. Música, baile y celebración inolvidable.' },
];


let currentIndex = 0;

// Config and Data Load
function obtenerConfig() {
    const defaultConfig = { showGiftData: false, giftCard: 'XXXX XXXX XXXX XXXX', giftClabe: 'XXXXXXXXXXXXXXXXXX' };
    return window.BODA_CONFIG ? { ...defaultConfig, ...window.BODA_CONFIG } : defaultConfig;
}

function leerInvitadosLocales() {
    try { return JSON.parse(localStorage.getItem(STORAGE_GUESTS_KEY) || '[]'); } catch { return []; }
}

async function cargarInvitados() {
    try {
        const response = await fetch('invitados.json', { cache: 'no-store' });
        const data = await response.json();
        const invitadosArchivo = Array.isArray(data.invitados) ? data.invitados : [];
        return [...invitadosArchivo, ...leerInvitadosLocales()];
    } catch {
        return leerInvitadosLocales();
    }
}

function mostrarInvitado(invitado) {
    if (invitado.id !== 'general') {
        const greetingContainer = document.getElementById('guest-greeting-container');
        const nombreSpan = document.getElementById('invitado-nombre');
        if (greetingContainer && nombreSpan) {
            nombreSpan.innerText = invitado.nombre;
            greetingContainer.classList.remove('hidden');
        }
    }
}

function mostrarDatosRegalo(config) {
    if (!config.showGiftData) return;
    const section = document.getElementById('gift-section-content');
    const cardEl = document.getElementById('gift-card');
    const clabeEl = document.getElementById('gift-clabe');
    if (section) section.style.display = 'grid';
    if (cardEl) cardEl.innerText = config.giftCard;
    if (clabeEl) clabeEl.innerText = config.giftClabe;
}

// RSVP
function obtenerConfirmacionesLocales() {
    try { return JSON.parse(localStorage.getItem(STORAGE_RSVP_KEY) || '[]'); } catch { return []; }
}
function guardarConfirmacionLocal(registro) {
    const confirmaciones = obtenerConfirmacionesLocales().filter((item) => item.invitadoId !== registro.invitadoId);
    confirmaciones.push(registro);
    localStorage.setItem(STORAGE_RSVP_KEY, JSON.stringify(confirmaciones));
}

function obtenerCambiosRSVP() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_RSVP_CHANGES_KEY) || '{}');
        return data && typeof data === 'object' ? data : {};
    } catch {
        return {};
    }
}

function obtenerCambiosRSVPPorInvitado(invitadoIdValue) {
    const cambios = obtenerCambiosRSVP();
    const key = String(invitadoIdValue || 'general');
    return Number(cambios[key] || 0);
}

function incrementarCambiosRSVPPorInvitado(invitadoIdValue) {
    const cambios = obtenerCambiosRSVP();
    const key = String(invitadoIdValue || 'general');
    const actual = Number(cambios[key] || 0);
    cambios[key] = actual + 1;
    localStorage.setItem(STORAGE_RSVP_CHANGES_KEY, JSON.stringify(cambios));
    return cambios[key];
}

function actualizarEstadoRSVP(mensaje, isError = false) {
    const estado = document.getElementById('rsvp-estado');
    if(!estado) return;
    estado.innerText = mensaje;
    estado.style.color = isError ? '#8C3B3B' : '#d4af37';
    estado.style.opacity = '1';
}

function inicializarRSVP() {
    const btnSi = document.getElementById('btn-si');
    const btnNo = document.getElementById('btn-no');
    if(!btnSi || !btnNo) return;
    
    const previoLocal = obtenerConfirmacionesLocales().find((item) => item.invitadoId === invitadoActual.id);
    
    const btnReset = document.getElementById('btn-reset-rsvp');
    const avisoCambio = document.getElementById('rsvp-cambio-aviso');
    let cambiosUsados = obtenerCambiosRSVPPorInvitado(invitadoActual.id);

    const actualizarAvisoCambio = () => {
        if (!avisoCambio) return;
        if (cambiosUsados >= 1) {
            avisoCambio.classList.remove('hidden');
        } else {
            avisoCambio.classList.add('hidden');
        }
    };
    actualizarAvisoCambio();

    // Función para bloquear botones
    const bloquearBotones = (status) => {
        actualizarEstadoRSVP(`Ya registramos tu respuesta: ${status.toUpperCase().replace('_', ' ')}. Gracias.`);
        btnSi.disabled = true; btnNo.disabled = true;
        btnSi.style.opacity = '0.5'; btnNo.style.opacity = '0.5';
        if (btnReset && cambiosUsados < 1) {
            btnReset.classList.remove('hidden');
        } else if (btnReset) {
            btnReset.classList.add('hidden');
        }
        actualizarAvisoCambio();
    };

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (cambiosUsados >= 1) {
                actualizarEstadoRSVP('Ya utilizaste tu unico cambio de respuesta.', true);
                btnReset.classList.add('hidden');
                return;
            }

            const confirmaciones = obtenerConfirmacionesLocales().filter(item => item.invitadoId !== invitadoActual.id);
            localStorage.setItem(STORAGE_RSVP_KEY, JSON.stringify(confirmaciones));
            cambiosUsados = incrementarCambiosRSVPPorInvitado(invitadoActual.id);
            btnSi.disabled = false; btnNo.disabled = false;
            btnSi.style.opacity = '1'; btnNo.style.opacity = '1';
            document.getElementById('rsvp-estado').innerText = '';
            btnReset.classList.add('hidden');
            actualizarAvisoCambio();
        });
    }

    if (previoLocal) {
        bloquearBotones(previoLocal.estado);
    }

    // Sincronizar con el servidor para evitar duplicados si se cambió de dispositivo/caché
    const config = obtenerConfig();
    if (config.rsvpEndpoint) {
        fetch(config.rsvpEndpoint)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const currentId = String(invitadoActual.id);
                    const currentNombre = String(invitadoActual.nombre || '').toLowerCase().trim();
                    
                    const matches = data
                        .map((item, index) => ({ item, index }))
                        .filter(({ item }) => {
                            const rowId = String(item.invitadoId);
                            const rowNombre = String(item.nombre || '').toLowerCase().trim();
                            // Mismo ID o mismo nombre (si somos general)
                            if (currentId !== 'general' && rowId === currentId) return true;
                            if (currentId === 'general' && rowNombre === currentNombre && currentNombre !== '') return true;
                            return false;
                        });

                    if (matches.length) {
                        const matchesServer = matches
                            .slice()
                            .sort((a, b) => {
                                const timeA = Date.parse(a.item.fecha || a.item.timestamp || '') || 0;
                                const timeB = Date.parse(b.item.fecha || b.item.timestamp || '') || 0;
                                if (timeA !== timeB) return timeA - timeB;
                                return a.index - b.index;
                            })
                            .at(-1).item;

                        guardarConfirmacionLocal(matchesServer);
                        bloquearBotones(matchesServer.estado);
                    }
                }
            })
            .catch(err => console.error("Error sincronizando con servidor:", err));
    }

    const manejarClick = async (estado) => {
        const registro = {
            invitadoId: invitadoActual.id,
            nombre: invitadoActual.nombre,
            pases: invitadoActual.pases,
            tipo: invitadoActual.tipo,
            estado,
            fecha: new Date().toISOString(),
            fuente: 'github-pages'
        };
        guardarConfirmacionLocal(registro);
        
        const config = obtenerConfig();
        if (config.rsvpEndpoint) {
            actualizarEstadoRSVP('Enviando tu respuesta...', false);
            btnSi.disabled = true; btnNo.disabled = true;
            btnSi.style.opacity = '0.5'; btnNo.style.opacity = '0.5';
            if (btnReset && cambiosUsados < 1) btnReset.classList.remove('hidden');
            if (btnReset && cambiosUsados >= 1) btnReset.classList.add('hidden');
            
            try {
                // Se envía el POST a la URL de Google Apps Script. 
                // Se usa 'no-cors' para evitar errores de preflight con POST.
                await fetch(config.rsvpEndpoint, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registro)
                });
                actualizarEstadoRSVP('¡Gracias por confirmar! Tu respuesta fue guardada remotamente.');
            } catch (error) {
                console.error("Error al enviar RSVP:", error);
                actualizarEstadoRSVP('Guardado localmente. Hubo un problema conectando al servidor.', true);
                btnSi.disabled = false; btnNo.disabled = false;
                btnSi.style.opacity = '1'; btnNo.style.opacity = '1';
            }
        } else {
            actualizarEstadoRSVP('Gracias por confirmar. Tu respuesta fue guardada localmente.');
            btnSi.disabled = true; btnNo.disabled = true;
            btnSi.style.opacity = '0.5'; btnNo.style.opacity = '0.5';
            if (btnReset && cambiosUsados < 1) btnReset.classList.remove('hidden');
            if (btnReset && cambiosUsados >= 1) btnReset.classList.add('hidden');
        }
    };

    btnSi.addEventListener('click', () => manejarClick('si_asistire'));
    btnNo.addEventListener('click', () => manejarClick('no_asistire'));
}

// UI Interactions
function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const iconMenu = btn.querySelector('.icon-menu');
    const iconClose = btn.querySelector('.icon-close');

    btn.addEventListener('click', () => {
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            menu.classList.remove('hidden');
            setTimeout(() => menu.classList.remove('opacity-0'), 10);
            iconMenu.classList.add('hidden');
            iconClose.classList.remove('hidden');
        } else {
            menu.classList.add('opacity-0');
            setTimeout(() => menu.classList.add('hidden'), 300);
            iconMenu.classList.remove('hidden');
            iconClose.classList.add('hidden');
        }
    });
}

window.scrollToSection = function(id) {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('mobile-menu-btn');
    if (!menu.classList.contains('hidden')) {
        btn.click(); // Close mobile menu
    }
    const el = document.getElementById(id);
    if (el) {
        const offsetPosition = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
};

function setupCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
    
    // Solo en desktop
    if (window.innerWidth < 768) return;

    window.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

function setupScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach(el => observer.observe(el));
    
    // Parallax on hero
    const heroContent = document.getElementById('hero-content');
    window.addEventListener('scroll', () => {
        if(window.scrollY < window.innerHeight && heroContent) {
            heroContent.style.transform = `translateY(${window.scrollY * 0.4}px)`;
            heroContent.style.opacity = 1 - (window.scrollY / window.innerHeight) * 1.5;
        }
    });
}

// Schedule and Modal
function renderSchedule() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    grid.innerHTML = SCHEDULE.map((event, index) => `
        <div class="event-card border-b lg:border-b-0 lg:border-r border-white/10 p-8 md:p-12 cursor-pointer group hover:bg-white/5 transition-colors" onclick="openModal(${index})">
            <div class="text-wedding-gold font-mono text-sm tracking-widest uppercase mb-6 flex items-center justify-between">
                <span>${event.time}</span>
                <svg class="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-wedding-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </div>
            <h3 class="text-2xl md:text-3xl font-heading font-bold uppercase mb-4 text-white">${event.title}</h3>
            <p class="text-gray-400 font-sans line-clamp-2">${event.description}</p>
        </div>
    `).join('');
}

window.openModal = function(index) {
    currentIndex = index;
    updateModalContent();
    const modal = document.getElementById('event-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('event-modal-content').classList.remove('scale-95');
    }, 10);
};

window.closeModal = function() {
    const modal = document.getElementById('event-modal');
    modal.classList.add('opacity-0');
    document.getElementById('event-modal-content').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

function updateModalContent() {
    const event = SCHEDULE[currentIndex];
    
    const imgEl = document.getElementById('modal-img');
    // Simple fade effect
    imgEl.style.opacity = 0;
    setTimeout(() => {
        imgEl.src = event.image;
        imgEl.style.opacity = 1;
    }, 200);

    document.getElementById('modal-title').innerText = event.title;
    document.getElementById('modal-time').innerText = event.time;
    document.getElementById('modal-location').innerText = event.location;
    document.getElementById('modal-desc').innerText = event.description;
}

// Keyboard nav in modal
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('event-modal');
    if (modal && !modal.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            currentIndex = (currentIndex - 1 + SCHEDULE.length) % SCHEDULE.length;
            updateModalContent();
        } else if (e.key === 'ArrowRight') {
            currentIndex = (currentIndex + 1) % SCHEDULE.length;
            updateModalContent();
        } else if (e.key === 'Escape') {
            closeModal();
        }
    }
});

// Countdown timer
function initCountdown() {
    const targetDate = new Date('May 2, 2026 12:00:00').getTime();
    
    function update() {
        const now = new Date().getTime();
        let distance = targetDate - now;
        if (distance < 0) distance = 0;
        
        const cdDias = document.getElementById('cd-dias');
        if(!cdDias) return;

        cdDias.innerText = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
        document.getElementById('cd-horas').innerText = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
        document.getElementById('cd-minutos').innerText = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        document.getElementById('cd-segundos').innerText = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
    }
    
    update();
    setInterval(update, 1000);
}

async function init() {
    const invitados = await cargarInvitados();
    let encontrado = invitados.find((i) => i.id === invitadoId);
    
    // Si el invitado no está localmente pero sus datos vienen por la URL (generado por el Admin)
    if (!encontrado && nombreViaURL) {
        encontrado = {
            id: invitadoId !== 'general' ? invitadoId : ('inv' + Date.now()),
            nombre: nombreViaURL,
            pases: Number(pasesViaURL) || 1,
            tipo: tipoViaURL || 'familia'
        };
    }
    
    invitadoActual = encontrado || invitadoActual;
    const config = obtenerConfig();

    mostrarInvitado(invitadoActual);
    mostrarDatosRegalo(config);
    setupMobileMenu();
    setupCustomCursor();
    setupScrollAnimations();
    renderSchedule();
    inicializarRSVP();
    initCountdown();
}

init();