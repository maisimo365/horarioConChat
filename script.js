// Datos precargados desde JSON
let horarioData = {};
let materiasPorNivel = {};
let gruposPorMateria = {};
let horarioSeleccionado = {};
let materiasAgregadas = [];

// Colores para materias
const coloresMaterias = [
    '#FFD700', '#87CEEB', '#98FB98', '#FFA07A',
    '#DDA0DD', '#FF6347', '#40E0D0', '#FF69B4',
    '#F0E68C', '#ADD8E6', '#90EE90', '#FFB6C1',
    '#E6E6FA', '#FFDAB9', '#AFEEEE', '#D8BFD8'
];

// Elementos del DOM
const nivelSelect = document.getElementById('nivel-select');
const materiaSelect = document.getElementById('materia-select');
const grupoSelect = document.getElementById('grupo-select');
const horarioBody = document.getElementById('horario-body');
const btnAgregar = document.getElementById('btn-agregar');
const btnLimpiar = document.getElementById('btn-limpiar');
const btnGuardar = document.getElementById('btn-guardar');
const colorLeyenda = document.getElementById('color-leyenda');

// Solución GitHub Pages: Verificar si estamos en producción
const esProduccion = window.location.host.includes('github.io');

// Cargar datos del localStorage al iniciar
function cargarDesdeLocalStorage() {
    if (esProduccion) {
        // Limpiar cache en producción
        localStorage.removeItem('horarioSeleccionado');
        localStorage.removeItem('materiasAgregadas');
        return;
    }

    const horarioGuardado = localStorage.getItem('horarioSeleccionado');
    const materiasGuardadas = localStorage.getItem('materiasAgregadas');
    
    if (horarioGuardado) {
        horarioSeleccionado = JSON.parse(horarioGuardado);
    }
    
    if (materiasGuardadas) {
        materiasAgregadas = JSON.parse(materiasGuardadas);
        actualizarListaMaterias();
    }
}

// Guardar datos en localStorage
function guardarEnLocalStorage() {
    if (!esProduccion) {
        localStorage.setItem('horarioSeleccionado', JSON.stringify(horarioSeleccionado));
        localStorage.setItem('materiasAgregadas', JSON.stringify(materiasAgregadas));
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.getElementById('notificacion');
    notificacion.textContent = mensaje;
    notificacion.className = 'notificacion mostrar';
    
    if (tipo === 'error') {
        notificacion.style.backgroundColor = '#f44336';
    } else if (tipo === 'success') {
        notificacion.style.backgroundColor = '#4CAF50';
    } else {
        notificacion.style.backgroundColor = '#333';
    }
    
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
    }, 3000);
}

// Cargar datos del JSON al iniciar
async function cargarDatos() {
    try {
        const response = await fetch('horario.json');
        if (!response.ok) throw new Error("No se pudo cargar el horario");
        horarioData = await response.json();
        procesarDatos();
        actualizarSelectores();
        cargarDesdeLocalStorage();
        generarHorario();
        
        // Solución GitHub Pages: Forzar recarga de datos
        if (esProduccion) {
            setTimeout(() => {
                generarHorario();
                actualizarListaMaterias();
            }, 500);
        }
    } catch (error) {
        console.error("Error:", error);
        horarioBody.innerHTML = `
            <tr>
                <td colspan="7" class="error">
                    Error al cargar el horario: ${error.message}<br>
                    Verifica que el archivo "horario.json" exista.
                </td>
            </tr>
        `;
        mostrarNotificacion('Error al cargar el horario', 'error');
    }
}

// Procesar datos para crear listas de materias y grupos
function procesarDatos() {
    materiasPorNivel = {};
    gruposPorMateria = {};

    for (const nivel in horarioData) {
        materiasPorNivel[nivel] = new Set();
        gruposPorMateria[nivel] = {};

        for (const hora in horarioData[nivel]) {
            for (const dia in horarioData[nivel][hora]) {
                const clases = Array.isArray(horarioData[nivel][hora][dia])
                    ? horarioData[nivel][hora][dia]
                    : [horarioData[nivel][hora][dia]];

                clases.forEach(clase => {
                    materiasPorNivel[nivel].add(clase.materia);
                    if (!gruposPorMateria[nivel][clase.materia]) {
                        gruposPorMateria[nivel][clase.materia] = new Set();
                    }
                    gruposPorMateria[nivel][clase.materia].add(clase.grupo);
                });
            }
        }
    }
}

// Actualizar selectores de materia y grupo
function actualizarSelectores() {
    const nivel = nivelSelect.value;
    materiaSelect.innerHTML = '<option value="">Seleccione una materia</option>';
    grupoSelect.innerHTML = '<option value="">Seleccione un grupo</option>';

    if (materiasPorNivel[nivel]) {
        Array.from(materiasPorNivel[nivel]).sort().forEach(materia => {
            const option = document.createElement('option');
            option.value = materia;
            option.textContent = materia;
            materiaSelect.appendChild(option);
        });
    }
}

function actualizarGrupos() {
    const nivel = nivelSelect.value;
    const materia = materiaSelect.value;

    grupoSelect.innerHTML = '<option value="">Seleccione un grupo</option>';

    if (materia && gruposPorMateria[nivel] && gruposPorMateria[nivel][materia]) {
        Array.from(gruposPorMateria[nivel][materia]).sort().forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo;

            let docente = '';
            for (const hora in horarioData[nivel]) {
                for (const dia in horarioData[nivel][hora]) {
                    const clases = Array.isArray(horarioData[nivel][hora][dia])
                        ? horarioData[nivel][hora][dia]
                        : [horarioData[nivel][hora][dia]];

                    clases.forEach(clase => {
                        if (clase.materia === materia && clase.grupo === grupo) {
                            docente = formatearNombreDocente(clase.docente);
                        }
                    });
                    if (docente) break;
                }
                if (docente) break;
            }

            option.textContent = `Grupo ${grupo}${docente ? ' - ' + docente : ''}`;
            grupoSelect.appendChild(option);
        });
    }
}

function generarHorario() {
    horarioBody.innerHTML = '';

    const horas = ["0645", "0815", "0945", "1115", "1245", "1415", "1545", "1715", "1845", "2015", "2145"];

    const materiasUnicas = [];
    for (const hora in horarioSeleccionado) {
        for (const dia in horarioSeleccionado[hora]) {
            horarioSeleccionado[hora][dia].forEach(clase => {
                if (!materiasUnicas.includes(clase.materia)) {
                    materiasUnicas.push(clase.materia);
                }
            });
        }
    }

    const colorMap = {};
    materiasUnicas.forEach((materia, index) => {
        colorMap[materia] = coloresMaterias[index % coloresMaterias.length];
    });

    actualizarLeyendaColores(colorMap);

    horas.forEach(hora => {
        const row = document.createElement('tr');

        const horaCell = document.createElement('td');
        horaCell.textContent = formatearHora(hora);
        horaCell.className = 'hora-col';
        row.appendChild(horaCell);

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        dias.forEach(dia => {
            const cell = document.createElement('td');
            const clases = horarioSeleccionado[hora]?.[dia] || [];

            if (clases.length > 0) {
                clases.sort((a, b) => a.materia.localeCompare(b.materia));

                cell.innerHTML = clases.map(clase => `
                    <div class="materia" style="background-color: ${colorMap[clase.materia]};
                            ${clases.length > 1 ? 'border-left: 3px solid red;' : ''}">
                        <div class="nombre">${clase.materia}</div>
                        <div class="grupo">G: ${clase.grupo}</div>
                        <div class="docente">${formatearNombreDocente(clase.docente)}</div>
                        <div class="aula">Aula: ${clase.aula}</div>
                    </div>
                `).join('');

                if (clases.length > 1) {
                    cell.classList.add('choque-horario');
                    cell.title = `Choque de horario entre ${clases.length} materias`;
                }
            }

            row.appendChild(cell);
        });

        horarioBody.appendChild(row);
    });
}

function actualizarLeyendaColores(colorMap) {
    colorLeyenda.innerHTML = '';
    Object.entries(colorMap).forEach(([materia, color]) => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.innerHTML = `
            <span class="color-muestra" style="background-color: ${color}"></span>
            ${materia}
        `;
        colorLeyenda.appendChild(item);
    });
}

// Función para actualizar la lista visual de materias
function actualizarListaMaterias() {
    const listaMaterias = document.getElementById('lista-materias');
    listaMaterias.innerHTML = '';

    if (materiasAgregadas.length === 0) {
        listaMaterias.innerHTML = '<p style="color: var(--gris-texto); font-style: italic;">No hay materias agregadas</p>';
        return;
    }

    materiasAgregadas.forEach((materia, index) => {
        const item = document.createElement('div');
        item.className = 'materia-item';
        
        const info = document.createElement('div');
        info.className = 'materia-info';
        info.innerHTML = `
            <strong>${materia.materia}</strong> - Grupo ${materia.grupo}<br>
            <small>${formatearNombreDocente(materia.docente)}</small>
        `;
        
        const eliminar = document.createElement('button');
        eliminar.className = 'materia-eliminar';
        eliminar.textContent = 'Eliminar';
        eliminar.onclick = () => eliminarMateria(index);
        
        item.appendChild(info);
        item.appendChild(eliminar);
        listaMaterias.appendChild(item);
    });
}

// Función para eliminar una materia específica
function eliminarMateria(index) {
    const materiaAEliminar = materiasAgregadas[index];
    
    // Eliminar del horario seleccionado
    for (const hora in horarioSeleccionado) {
        for (const dia in horarioSeleccionado[hora]) {
            horarioSeleccionado[hora][dia] = horarioSeleccionado[hora][dia].filter(
                clase => !(clase.materia === materiaAEliminar.materia && 
                         clase.grupo === materiaAEliminar.grupo)
            );
            
            // Eliminar día si está vacío
            if (horarioSeleccionado[hora][dia].length === 0) {
                delete horarioSeleccionado[hora][dia];
            }
        }
        
        // Eliminar hora si está vacía
        if (Object.keys(horarioSeleccionado[hora]).length === 0) {
            delete horarioSeleccionado[hora];
        }
    }
    
    // Eliminar de la lista
    materiasAgregadas.splice(index, 1);
    actualizarListaMaterias();
    generarHorario();
    guardarEnLocalStorage();
    mostrarNotificacion('Materia eliminada del horario', 'success');
}

function agregarClase() {
    const nivel = nivelSelect.value;
    const materia = materiaSelect.value;
    const grupo = grupoSelect.value;

    if (!materia || !grupo) {
        mostrarNotificacion('Por favor seleccione una materia y un grupo', 'error');
        return;
    }

    let agregadas = 0;
    let nuevaMateria = null;
    
    for (const hora in horarioData[nivel]) {
        for (const dia in horarioData[nivel][hora]) {
            const clases = Array.isArray(horarioData[nivel][hora][dia])
                ? horarioData[nivel][hora][dia]
                : [horarioData[nivel][hora][dia]];

            clases.forEach(clase => {
                if (clase.materia === materia && clase.grupo === grupo) {
                    if (!horarioSeleccionado[hora]) horarioSeleccionado[hora] = {};
                    if (!horarioSeleccionado[hora][dia]) horarioSeleccionado[hora][dia] = [];

                    const existe = horarioSeleccionado[hora][dia].some(c =>
                        c.materia === clase.materia &&
                        c.grupo === clase.grupo &&
                        c.docente === clase.docente
                    );

                    if (!existe) {
                        horarioSeleccionado[hora][dia].push(clase);
                        agregadas++;
                        nuevaMateria = {
                            materia: clase.materia,
                            grupo: clase.grupo,
                            docente: clase.docente,
                            nivel: nivel
                        };
                    }
                }
            });
        }
    }

    if (agregadas === 0) {
        mostrarNotificacion('Esta clase ya está en el horario', 'error');
    } else {
        // Añadir a la lista de materias si es nueva
        if (nuevaMateria && !materiasAgregadas.some(m => 
            m.materia === nuevaMateria.materia && 
            m.grupo === nuevaMateria.grupo &&
            m.nivel === nuevaMateria.nivel
        )) {
            materiasAgregadas.push(nuevaMateria);
            actualizarListaMaterias();
        }
        generarHorario();
        guardarEnLocalStorage();
        mostrarNotificacion('Materia agregada al horario', 'success');
    }
}

function limpiarHorario() {
    if (materiasAgregadas.length === 0) {
        mostrarNotificacion('El horario ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres limpiar todo el horario?')) {
        horarioSeleccionado = {};
        materiasAgregadas = [];
        actualizarListaMaterias();
        generarHorario();
        guardarEnLocalStorage();
        mostrarNotificacion('Horario limpiado correctamente', 'success');
    }
}

function formatearHora(hora) {
    return `${hora.substring(0, 2)}:${hora.substring(2)}`;
}

function formatearNombreDocente(nombre) {
    if (!nombre || nombre.includes("POR DESGINAR") || nombre.includes("POR DESIGNAR")) {
        return nombre || 'Docente por designar';
    }

    const partes = nombre.toLowerCase().split(' ');
    const apellidos = partes.slice(0, -1).map(p =>
        p.charAt(0).toUpperCase() + p.slice(1)
    );
    const nombrePropio = partes[partes.length - 1].charAt(0).toUpperCase() +
                         partes[partes.length - 1].slice(1);

    return `${nombrePropio} ${apellidos.join(' ')}`;
}

function guardarHorario() {
    if (materiasAgregadas.length === 0) {
        mostrarNotificacion('No hay materias en el horario para guardar', 'error');
        return;
    }

    // Verificar que html2canvas esté cargado
    if (typeof html2canvas !== 'function') {
        mostrarNotificacion('Error: La función de guardado no está disponible', 'error');
        return;
    }

    const elementoParaImagen = document.getElementById('horario-para-imagen');
    const loading = document.createElement('div');
    loading.textContent = 'Generando imagen...';
    loading.style.position = 'fixed';
    loading.style.top = '50%';
    loading.style.left = '50%';
    loading.style.transform = 'translate(-50%, -50%)';
    loading.style.backgroundColor = 'white';
    loading.style.padding = '20px';
    loading.style.borderRadius = '5px';
    loading.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    loading.style.zIndex = '1000';
    document.body.appendChild(loading);
    
    html2canvas(elementoParaImagen, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        document.body.removeChild(loading);
        const link = document.createElement('a');
        link.download = `Horario_UMSS_${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        mostrarNotificacion('Horario guardado como imagen', 'success');
    }).catch(err => {
        console.error('Error al generar la imagen:', err);
        document.body.removeChild(loading);
        mostrarNotificacion('Error al generar la imagen', 'error');
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', cargarDatos);
nivelSelect.addEventListener('change', actualizarSelectores);
materiaSelect.addEventListener('change', actualizarGrupos);
btnAgregar.addEventListener('click', agregarClase);
btnLimpiar.addEventListener('click', limpiarHorario);
btnGuardar.addEventListener('click', guardarHorario);

// Solución GitHub Pages: Forzar recarga después de 1 segundo
if (esProduccion) {
    setTimeout(() => {
        generarHorario();
        actualizarListaMaterias();
    }, 1000);
}