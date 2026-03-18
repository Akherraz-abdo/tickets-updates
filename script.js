let tickets = [];
let currentIdx = null;

// Core UI Logic
function updateUI() {
    renderTable();
    updateStats();
}

// Excel Handling
document.getElementById('excel-upload').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            
            const imported = rows.map(r => ({
                number: r.Number || r['Ticket Number'] || 'N/A',
                shortDesc: r['Short description'] || r.Description || 'No description',
                customer: r.Customer || 'Unspecified',
                userId: r['User ID'] || 'N/A',
                priority: r.Priority || '4',
                state: r.State || 'New',
                assignedTo: r['Assigned To'] || 'Agent 1',
                opened: r.Opened || new Date().toLocaleDateString(),
                notes: [],
                techName: '',
                techETA: ''
            }));
            tickets = [...tickets, ...imported];
            updateUI();
        } catch(err) {
            alert("Error reading Excel. Please check column names.");
        }
    };
    reader.readAsArrayBuffer(file);
};

// Table and Filters
function renderTable() {
    const tbody = document.getElementById('ticket-body');
    const search = document.getElementById('search-bar').value.toLowerCase();
    const agentF = document.getElementById('filter-agent').value;
    const priF = document.getElementById('filter-priority').value;

    const filtered = tickets.filter(t => {
        const matchesSearch = t.number.toLowerCase().includes(search) || t.customer.toLowerCase().includes(search);
        const matchesAgent = agentF === 'all' || t.assignedTo === agentF;
        const matchesPri = priF === 'all' || String(t.priority) === priF;
        return matchesSearch && matchesAgent && matchesPri;
    });

    tbody.innerHTML = filtered.map((t) => {
        const actualIndex = tickets.indexOf(t);
        return `
            <tr class="clickable-row" onclick="openDetail(${actualIndex})">
                <td><strong>${t.number}</strong></td>
                <td>${t.customer}</td>
                <td>${t.shortDesc}</td>
                <td><span class="badge">P${t.priority}</span></td>
                <td>${t.state}</td>
                <td>${t.assignedTo}</td>
                <td><button class="btn btn-secondary" style="padding:4px 8px; font-size: 10px;" onclick="event.stopPropagation(); deleteTicket(${actualIndex})">DELETE</button></td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    document.getElementById('stat-total').innerText = tickets.length;
    document.getElementById('stat-critical').innerText = tickets.filter(t => String(t.priority) === '1').length;
    document.getElementById('stat-parts').innerText = tickets.filter(t => t.state === 'Parts Ordered').length;
    document.getElementById('stat-dispatched').innerText = tickets.filter(t => t.state === 'Tech Dispatched').length;
}

// Detail View
function openDetail(idx) {
    currentIdx = idx;
    const t = tickets[idx];
    document.getElementById('detail-title').innerText = t.number;
    document.getElementById('det-cust').innerText = t.customer;
    document.getElementById('det-open').innerText = t.opened;
    document.getElementById('det-update-state').value = t.state;
    document.getElementById('det-tech-name').value = t.techName || '';
    document.getElementById('det-tech-eta').value = t.techETA || '';
    renderNotes();
    document.getElementById('detail-modal').style.display = 'block';
}

function addNote() {
    const box = document.getElementById('note-text');
    if(!box.value.trim()) return;
    tickets[currentIdx].notes.push({ text: box.value, time: new Date().toLocaleString() });
    box.value = '';
    renderNotes();
}

function renderNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = tickets[currentIdx].notes.map(n => `
        <div style="margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px">
            <p style="font-size:0.9rem">${n.text}</p>
            <small style="color:var(--text-muted)">${n.time}</small>
        </div>
    `).reverse().join('');
}

function updateTicketField(field, val) {
    if(currentIdx === null) return;
    tickets[currentIdx][field] = val;
    updateUI();
}

// Global Actions
function deleteTicket(idx) {
    if(confirm("Permanently delete this ticket?")) {
        tickets.splice(idx, 1);
        updateUI();
    }
}

function clearAllTickets() {
    if(confirm("Are you sure you want to clear the entire list?")) {
        tickets = [];
        updateUI();
    }
}

// Modal Controls
function openManualModal() { document.getElementById('manual-modal').style.display = 'block'; }
function closeManualModal() { document.getElementById('manual-modal').style.display = 'none'; }
function closeDetailModal() { document.getElementById('detail-modal').style.display = 'none'; }

document.getElementById('manual-form').onsubmit = (e) => {
    e.preventDefault();
    tickets.push({
        number: document.getElementById('add-number').value,
        priority: document.getElementById('add-priority').value,
        shortDesc: document.getElementById('add-desc').value,
        customer: document.getElementById('add-customer').value,
        userId: document.getElementById('add-userid').value,
        assignedTo: document.getElementById('add-assigned').value,
        state: document.getElementById('add-state').value,
        opened: new Date().toLocaleDateString(),
        notes: [], techName: '', techETA: ''
    });
    closeManualModal();
    updateUI();
    e.target.reset();
};

document.getElementById('theme-toggle').onclick = () => {
    const root = document.documentElement;
    const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
};

// Listeners
document.getElementById('search-bar').oninput = renderTable;
document.getElementById('filter-agent').onchange = renderTable;
document.getElementById('filter-priority').onchange = renderTable;
window.onclick = (e) => { if(e.target.className === 'modal-overlay') { closeManualModal(); closeDetailModal(); } };
