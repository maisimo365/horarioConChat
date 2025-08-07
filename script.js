// Datos precargados desde JSON
let horarioData = {};
let materiasPorNivel = {};
let gruposPorMateria = {};
let horarioSeleccionado = {};

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
const colorLeyenda = document.getElementById('color-leyenda');

// Cargar datos del JSON al iniciar
async function cargarDatos() {
    try {
        const response = await fetch('horario.json');
        if (!response.ok) throw new Error("No se pudo cargar el horario");
        horarioData = await response.json();
        procesarDatos();
        actualizarSelectores();
    } catch (error) {
        console.error("Error:", error);
        horarioBody.innerHTML = `
            <tr>
                <td colspan="7" class="error">
                    Error al cargar el horario: ${error.message}<br>
                    Verifica que el archivo \"horario.json\" exista.
                </td>
            </tr>
        `;
    }
}

// Procesar datos para crear listas de materias y grupos
function procesarDatos() {
    materiasPorNivel = {};
    gruposPorMateria = {};
    horarioSeleccionado = {};

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

function agregarClase() {
    const nivel = nivelSelect.value;
    const materia = materiaSelect.value;
    const grupo = grupoSelect.value;

    if (!materia || !grupo) {
        alert('Por favor seleccione una materia y un grupo');
        return;
    }

    let agregadas = 0;
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
                    }
                }
            });
        }
    }

    if (agregadas === 0) {
        alert('Esta clase ya está en el horario');
    } else {
        generarHorario();
    }
}

function limpiarHorario() {
    horarioSeleccionado = {};
    generarHorario();
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

document.addEventListener('DOMContentLoaded', cargarDatos);
nivelSelect.addEventListener('change', actualizarSelectores);
materiaSelect.addEventListener('change', actualizarGrupos);
btnAgregar.addEventListener('click', agregarClase);
btnLimpiar.addEventListener('click', limpiarHorario);