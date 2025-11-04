class TimeTracker {
  constructor() {
    this.entries = JSON.parse(localStorage.getItem('timeEntries')) || [];
    
    this.form = document.getElementById('timeEntryForm');
    this.entriesList = document.getElementById('entriesList');
    this.currentTimeEl = document.getElementById('currentTime');
    this.startTimeInput = document.getElementById('startTime');
    this.endTimeInput = document.getElementById('endTime');
    
    document.getElementById('goToRegistros').onclick = () => this.showRegistros();
    document.getElementById('voltarBtn').onclick = () => this.showHome();
    
    document.getElementById('clearAllBtn').onclick = () => this.openClearAllModal();
    document.getElementById('closeClearModal').onclick = () => this.closeClearAllModal();
    document.getElementById('cancelClearModal').onclick = () => this.closeClearAllModal();
    document.getElementById('confirmClearModal').onclick = () => this.clearAll();
    
    document.getElementById('exportPdfBtn').onclick = () => this.openPdfModal();
    document.getElementById('closeModal').onclick = () => this.closePdfModal();
    document.getElementById('cancelModal').onclick = () => this.closePdfModal();
    document.getElementById('downloadPdfBtn').onclick = () => this.generatePdf();
    
    this.form.onsubmit = (e) => this.addEntry(e);
    
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
    
    this.setCurrentDateTime();
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('toast-show'), 10);
    
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
  }
  
  showRegistros() {
    document.getElementById("homePage").style.display = "none";
    document.getElementById("registrosPage").style.display = "block";
    this.renderEntries();
  }
  
  showHome() {
    document.getElementById("homePage").style.display = "block";
    document.getElementById("registrosPage").style.display = "none";
  }
  
  setCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    this.startTimeInput.value = formatted;
    this.endTimeInput.value = formatted;
  }
  
  updateTime() {
    if (this.currentTimeEl)
      this.currentTimeEl.textContent = new Date().toLocaleString('pt-BR');
  }
  
  addEntry(e) {
    e.preventDefault();
    const s = new Date(this.startTimeInput.value);
    const eT = new Date(this.endTimeInput.value);
    
    if (eT <= s) {
      this.showToast("Fim deve ser depois do início!", "error");
      return;
    }
    
    this.entries.push({
      id: Date.now(),
      start: s.toISOString(),
      end: eT.toISOString(),
      duration: eT - s
    });
    
    this.save();
    this.setCurrentDateTime();
    this.renderEntries();
    this.showToast("Registro adicionado com sucesso!", "success");
  }
  
  deleteEntry(id) {
    this.entries = this.entries.filter(e => e.id !== id);
    this.save();
    this.renderEntries();
    this.showToast("Registro excluído!", "info");
  }
  
  renderEntries() {
    if (!this.entries.length) {
      this.entriesList.innerHTML = "<p>Nenhum registro.</p>";
      return;
    }
    
    const total = this.entries.reduce((a, b) => a + b.duration, 0);
    
    // Calcular dias únicos trabalhados
    const uniqueDays = new Set(
      this.entries.map(e => new Date(e.start).toLocaleDateString('pt-BR'))
    );
    const daysWorked = uniqueDays.size;
    const avgMillisecondsPerDay = total / daysWorked;
    const avgHours = Math.floor(avgMillisecondsPerDay / 3_600_000);
    const avgMinutes = Math.floor((avgMillisecondsPerDay % 3_600_000) / 60_000);
    
    this.entriesList.innerHTML = `
        <table class="entries-table">
            <thead>
                <tr>
                    <th>Data</th><th>Início</th><th>Fim</th><th>Duração</th><th>Ação</th>
                </tr>
            </thead>
            <tbody>
                ${this.entries.map(e => `
                    <tr>
                        <td>${new Date(e.start).toLocaleDateString('pt-BR')}</td>
                        <td>${this.format(new Date(e.start))}</td>
                        <td>${this.format(new Date(e.end))}</td>
                        <td>${this.formatDur(e.duration)}</td>
                        <td><button class="delete-btn" onclick="tracker.deleteEntry(${e.id})">🗑️</button></td>
                    </tr>`).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="3"><b>Total de Horas do Mês</b></td><td>${this.formatDur(total)}</td><td></td></tr>
                <tr class="stats-row">
                    <td colspan="5">
                        <div class="work-stats">
                            <span><b>Dias Trabalhados:</b> ${daysWorked}dias</span>
                            <span><b>Média Por Dia:</b> ${avgHours}h ${avgMinutes.toString().padStart(2, '0')}min</span>
                        </div>
                    </td>
                </tr>
            </tfoot>
        </table>`;
  }
  
  openClearAllModal() { document.getElementById("clearAllModal").style.display = "block"; }
  closeClearAllModal() { document.getElementById("clearAllModal").style.display = "none"; }
  clearAll() {
    this.entries = [];
    this.save();
    this.renderEntries();
    this.closeClearAllModal();
    this.showToast("Todos os registros foram limpos!", "warning");
  }
  
  openPdfModal() { document.getElementById("pdfModal").style.display = "block"; }
  closePdfModal() { document.getElementById("pdfModal").style.display = "none"; }
  
  async generatePdf() {
    const name = document.getElementById("personName").value.trim();
    
    if (!name) {
      this.showToast("Nome é obrigatório!", "error");
      return;
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Preparar dados para a tabela
    const tableData = this.entries.map(e => [
      new Date(e.start).toLocaleDateString('pt-BR'),
      this.format(new Date(e.start)),
      this.format(new Date(e.end)),
      this.formatDur(e.duration)
    ]);
    
    // Calcular total
    const total = this.entries.reduce((a, b) => a + b.duration, 0);
    
    // Usar autoTable para criar a tabela
    pdf.autoTable({
      head: [
        ['Data', 'Hora de Entrada', 'Hora de Saída', 'Total de Horas']
      ],
      body: tableData,
      startY: 10,
      theme: 'grid',
      styles: {
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 3,
        halign: 'center',
        minCellHeight: 5
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 20 }
    });
    
    // Adicionar rodapé com nome e total
    const finalY = pdf.lastAutoTable.finalY + 3;
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(name, 14, finalY + 5);
    pdf.text(`Total de Horas do Mês: ${this.formatDur(total)}`, 133, finalY + 5);
    
    pdf.save(`horas-${name}.pdf`);
    this.closePdfModal();
    this.showToast("PDF baixado com sucesso!", "success");
  }
  
  save() { localStorage.setItem("timeEntries", JSON.stringify(this.entries)); }
  
  format(d) { return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  formatDur(ms) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor(ms % 3_600_000 / 60_000);
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  }
}

const tracker = new TimeTracker();