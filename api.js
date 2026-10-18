
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let notes = [];


function setBusy(isBusy) {
    document.querySelectorAll("button").forEach((button) => {
        button.disabled = isBusy;
    });
}


function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

async function request(url, options = {}) {
    const response = await fetch(url, options);

    let data = null;

    if (response.status !== 204) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await response.json();
        }
    }

    if (!response.ok) {
        const error = new Error(
            `Request failed with status ${response.status}`
        );

        error.status = response.status;
        throw error;
    }

    return {
        data,
        status: response.status
    };
}

function renderNotes() {
    notesList.replaceChildren();

    if (notes.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No notes yet. Load or create a note.";
        notesList.appendChild(emptyItem);
        return;
    }

    notes.forEach((note) => {
        const item = document.createElement("li");
        item.className = "note";

        const title = document.createElement("h3");
        title.textContent = note.title || "Untitled note";

        const body = document.createElement("p");
        body.textContent = note.body || "No body provided.";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteNote(note.id);
        });

        item.append(title, body, deleteButton);
        notesList.appendChild(item);
    });
}

async function loadNotes() {
    setBusy(true);
    showStatus("Loading notes...");

    try {
        const result = await request(`${API_URL}?_limit=10`);

        notes = result.data || [];
        renderNotes();

        if (notes.length === 0) {
            showStatus("No notes were found.", "success");
        } else {
            showStatus(
                `Loaded ${notes.length} notes from the server.`,
                "success"
            );
        }
    } catch (error) {
        showStatus(
            "Could not load notes. Please check your connection and try again.",
            "error"
        );
        console.error("Load notes error:", error);
    } finally {
        setBusy(false);
    }
}

async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        showStatus("Please enter a title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must be 100 characters or fewer.", "error");
        titleInput.focus();
        return;
    }

    setBusy(true);
    showStatus("Creating note...");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: 1
            })
        });

        const newNote = result.data;

       
        if (newNote) {
            notes.unshift(newNote);
            renderNotes();
        }

        noteForm.reset();

        showStatus(
            `Note created (status ${result.status}, id ${newNote.id}).`,
            "success"
        );
    } catch (error) {
        showStatus(
            "Could not create the note. Please try again.",
            "error"
        );
        console.error("Create note error:", error);
    } finally {
        setBusy(false);
    }
}


async function deleteNote(id) {
    setBusy(true);
    showStatus("Deleting note...");

    try {
        const result = await request(`${API_URL}/${id}`, {
            method: "DELETE"
        });

       
        notes = notes.filter((note) => note.id !== id);
        renderNotes();

        showStatus(
            `Note ${id} deleted (status ${result.status}).`,
            "success"
        );
    } catch (error) {
        showStatus(
            `Could not delete note ${id}. Please try again.`,
            "error"
        );
        console.error("Delete note error:", error);
    } finally {
        setBusy(false);
    }
}


loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);


renderNotes();
