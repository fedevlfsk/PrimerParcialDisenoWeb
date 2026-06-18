const API_URL = "https://jsonplaceholder.typicode.com/photos";

// Indica si estamos editando una canción existente o agregando una nueva
let modoEdicion = false;

// Contador para numerar las canciones en la lista visualmente
let trackIndex = 0;

document.addEventListener("DOMContentLoaded", function () {
  obtenerCanciones();

  // Cuando se envía el formulario, guardamos (agregar o actualizar según el modo)
  document.getElementById("form-cancion").addEventListener("submit", guardarCancion);

  // El botón cancelar resetea el formulario
  document.getElementById("btn-cancelar").addEventListener("click", resetearFormulario);
});


// GET

function obtenerCanciones() {
  const xhr = new XMLHttpRequest();

  /** Podriamos usar limit para no traer todas
  pero como por ahora no son demasiados datos, no es tan necesario todavia*/
  xhr.open("GET", API_URL, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const canciones = JSON.parse(xhr.responseText);
        mostrarCanciones(canciones);
      } else {
        mostrarMensaje("Error al obtener las canciones", true);
      }
    }
  };

  xhr.send();
}

// Recibe el array de canciones y las renderiza todas en la lista
function mostrarCanciones(canciones) {
  const lista = document.getElementById("tbody-canciones");

  lista.innerHTML = "";

  trackIndex = 0;

  canciones.forEach(function (cancion) {
    lista.appendChild(crearFila(cancion));
  });

  actualizarContador();
}

// Crea y devuelve un <li> con los datos de una canción
function crearFila(cancion) {
  trackIndex++;

  const li = document.createElement("li");
  li.className = "track-item";

  // Guardamos el ID en el elemento para poder encontrarlo después al editar o eliminar
  li.dataset.id = cancion.id;

  li.innerHTML = `
    <span class="track-num">${trackIndex}</span>
    <img class="track-cover" src="${cancion.thumbnailUrl}" alt="">
    <span class="track-title">${cancion.title}</span>
    <span class="track-album">Álbum ${cancion.albumId}</span>
    <div class="track-actions">
      <button type="button" class="btn-editar">Editar</button>
      <button type="button" class="btn-borrar">Eliminar</button>
    </div>
  `;

  // Asignamos los eventos a los botones
  li.querySelector(".btn-editar").addEventListener("click", function () {
    cargarCancionEnFormulario(cancion);
  });

  li.querySelector(".btn-borrar").addEventListener("click", function () {
    borrarCancion(cancion.id, li);
  });

  return li;
}

function actualizarContador() {
  const total = document.querySelectorAll(".track-item").length;
  document.getElementById("track-count").textContent = total + " tracks";
}


// POST 

function agregarCancion(datosCancion) {
  const xhr = new XMLHttpRequest();

  xhr.open("POST", API_URL, true);

  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      // La API devuelve 201 Created cuando el recurso se creó correctamente
      if (xhr.status === 201) {
        const cancionCreada = JSON.parse(xhr.responseText);

        // Agregamos la nueva canción al principio de la lista
        const lista = document.getElementById("tbody-canciones");
        lista.prepend(crearFila(cancionCreada));

        actualizarContador();
        resetearFormulario();
        mostrarMensaje("Canción agregada", false);
      } else {
        mostrarMensaje("No se pudo agregar la canción", true);
      }
    }
  };

  // Convertimos el objeto a json antes de enviarlo
  xhr.send(JSON.stringify(datosCancion));
}


// EDITAR 

// Carga los datos de una canción en el formulario para poder editarla
function cargarCancionEnFormulario(cancion) {
  document.getElementById("input-id").value = cancion.id;
  document.getElementById("input-title").value = cancion.title;
  document.getElementById("input-album").value = cancion.albumId;

  // Mostramos la portada de la cancion que estemos editando en el preview del formulario
  document.getElementById("previewThumbnail").src = cancion.thumbnailUrl;

  modoEdicion = true;

  document.getElementById("btn-guardar").textContent = "Actualizar canción";
  document.getElementById("btn-cancelar").style.display = "block";
}

function guardarCancion(event) {
  event.preventDefault(); // Evitamos que el formulario recargue la página

  const datosCancion = {
    title: document.getElementById("input-title").value,
    albumId: Number(document.getElementById("input-album").value),
  };

  if (modoEdicion) {
    const id = document.getElementById("input-id").value;
    actualizarCancion(id, datosCancion);
  } else {
    agregarCancion(datosCancion);
  }
}


// PUT

function actualizarCancion(id, datosCancion) {
  const xhr = new XMLHttpRequest();

  xhr.open("PUT", API_URL + "/" + id, true);
  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const actualizada = JSON.parse(xhr.responseText);

        actualizada.id = id;

        // Buscamos el li viejo por su data-id y lo reemplazamos con el nuevo
        const vieja = document.querySelector(`li[data-id="${id}"]`);
        const nueva = crearFila(actualizada);
        vieja.replaceWith(nueva);

        resetearFormulario();
        mostrarMensaje("Canción actualizada", false);
      } else {
        mostrarMensaje("No se pudo actualizar la canción", true);
      }
    }
  };

  xhr.send(JSON.stringify(datosCancion));
}


// DELETE

function borrarCancion(id, elemento) {
  if (!confirm("¿Eliminar esta canción?")) return;

  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", API_URL + "/" + id, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        elemento.remove();
        actualizarContador();
        mostrarMensaje("Canción eliminada", false);

        if (document.getElementById("input-id").value === String(id)) {
          resetearFormulario();
        }
      } else {
        mostrarMensaje("No se pudo eliminar la canción", true);
      }
    }
  };

  xhr.send();
}

function resetearFormulario() {
  document.getElementById("form-cancion").reset();
  document.getElementById("input-id").value = "";
  document.getElementById("previewThumbnail").src = "";

  modoEdicion = false;

  document.getElementById("btn-guardar").textContent = "Agregar canción";
  document.getElementById("btn-cancelar").style.display = "none";
}

function mostrarMensaje(texto, esError) {
  const p = document.getElementById("mensaje-estado");
  p.textContent = texto;
  p.className = esError ? "error" : "ok";
}
