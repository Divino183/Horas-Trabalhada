function decimalHoursToHHMM(decimalHours) {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

document.getElementById('timeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const entryTime = document.getElementById('entryTime').value;
    const exitTime = document.getElementById('exitTime').value;
    
    const entry = new Date(`${date}T${entryTime}`);
    const exit = new Date(`${date}T${exitTime}`);
    const diff = (exit - entry) / 1000 / 60 / 60;
    const totalHours = diff.toFixed(2);
    const totalHoursFormatted = decimalHoursToHHMM(diff);
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${date}</td>
        <td>${entryTime}</td>
        <td>${exitTime}</td>
        <td data-hours="${totalHours}">${totalHoursFormatted}</td>
        <td><button class="delete-row">Apagar</button></td>
    `;
    
    document.querySelector('#timeTable tbody').appendChild(newRow);
    
    newRow.querySelector('.delete-row').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja apagar este registro?')) {
            newRow.remove();
            updateTotalHoursMonth();
            saveRecords();
        }
    });
    
    this.reset();
    
    updateTotalHoursMonth();
    
    saveRecords();
});

function updateTotalHoursMonth() {
    const rows = document.querySelectorAll('#timeTable tbody tr');
    let totalHours = 0;
    rows.forEach(row => {
        totalHours += parseFloat(row.cells[3].getAttribute('data-hours'));
    });
    const formattedTotal = decimalHoursToHHMM(totalHours);
    document.getElementById('totalHoursMonth').innerText = `Total de Horas do Mês: ${formattedTotal}`;
}

function saveRecords() {
    const tableData = [];
    const rows = document.querySelectorAll('#timeTable tbody tr');
    rows.forEach(row => {
        const rowData = {
            date: row.cells[0].innerText,
            entryTime: row.cells[1].innerText,
            exitTime: row.cells[2].innerText,
            totalHours: row.cells[3].getAttribute('data-hours')
        };
        tableData.push(rowData);
    });
    localStorage.setItem('timeRecords', JSON.stringify(tableData));
    alert('Registros salvos com sucesso.');
}

function loadRecords() {
    const savedRecords = localStorage.getItem('timeRecords');
    if (savedRecords) {
        const tableData = JSON.parse(savedRecords);
        const tbody = document.querySelector('#timeTable tbody');
        tbody.innerHTML = ''; 
        tableData.forEach(record => {
            const totalHoursFormatted = decimalHoursToHHMM(parseFloat(record.totalHours));
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${record.date}</td>
                <td>${record.entryTime}</td>
                <td>${record.exitTime}</td>
                <td data-hours="${record.totalHours}">${totalHoursFormatted}</td>
                <td><button class="delete-row">Apagar</button></td>
            `;
            tbody.appendChild(newRow);
            
            newRow.querySelector('.delete-row').addEventListener('click', function() {
                if (confirm('Tem certeza que deseja apagar este registro?')) {
                    newRow.remove();
                    updateTotalHoursMonth();
                    saveRecords();
                }
            });
        });
        updateTotalHoursMonth();
    }
}

document.addEventListener('DOMContentLoaded', loadRecords);

const deleteModal = document.getElementById('deleteModal');
const deleteButton = document.getElementById('deleteButton');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');
const closeModal = document.getElementsByClassName('close')[0];

deleteButton.onclick = function() {
    deleteModal.style.display = 'block';
}

closeModal.onclick = function() {
    deleteModal.style.display = 'none';
}

cancelDelete.onclick = function() {
    deleteModal.style.display = 'none';
}

confirmDelete.onclick = function() {
    document.querySelector('#timeTable tbody').innerHTML = '';
    localStorage.removeItem('timeRecords');
    deleteModal.style.display = 'none';
    updateTotalHoursMonth();
    alert('Todos os registros foram apagados.');
}

window.onclick = function(event) {
    if (event.target == deleteModal) {
        deleteModal.style.display = 'none';
    }
}

document.getElementById('saveButton').addEventListener('click', saveRecords);

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Registro de Horário de Trabalho', 14, 22);
    
    doc.autoTable({
        html: '#timeTable',
        startY: 30,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'center'
        },
        headStyles: {
            fillColor: [200, 200, 200],
            textColor: 20,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columns: [
            { header: 'Data', dataKey: 'date' },
            { header: 'Hora de Entrada', dataKey: 'entryTime' },
            { header: 'Hora de Saída', dataKey: 'exitTime' },
            { header: 'Total de Horas', dataKey: 'totalHours' }
        ],
        columnStyles: {
            4: { cellWidth: 0 }
        }
    });
    
    const totalHoursText = document.getElementById('totalHoursMonth').innerText;
    doc.setFontSize(12);
    doc.text(totalHoursText, 14, doc.lastAutoTable.finalY + 10);
    
    doc.save('registro_horario_trabalho.pdf');
}

document.getElementById('generatePdfButton').addEventListener('click', generatePDF);