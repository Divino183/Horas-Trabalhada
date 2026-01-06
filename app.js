class TimeTracker {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('timeEntries')) || [];

        // Array com feriados nacionais brasileiros
        // Formato: 'DD/MM' para feriados fixos
        this.feriadosFixos = [
            '01/01', // Confraternização Universal
            '21/04', // Tiradentes
            '01/05', // Dia do Trabalho
            '07/09', // Independência do Brasil
            '12/10', // Nossa Senhora Aparecida
            '02/11', // Finados
            '15/11', // Proclamação da República
            '20/11', // Consciência Negra
            '25/12'  // Natal
        ];

        // Feriados móveis de 2025-2027 (Carnaval, Sexta-feira Santa, Corpus Christi)
        this.feriadosMoveis = [
            // 2026
            '03/04/2026', // Sexta-feira Santa 2026
            '04/06/2026', // Corpus Christi 2026
            // 2027
            '26/03/2027', // Sexta-feira Santa 2027
            '27/05/2027'  // Corpus Christi 2027
        ];

        // Array com frases do "VOCÊ SABIA?" - ADICIONE MAIS FRASES AQUI!
        this.voceSabiaFrases = [
            {
                texto: "O pagamento das férias deve ser feito até dois dias antes do início do período de descanso, garantindo que o trabalhador receba antes de sair de férias:",
                artigo: "Artigo 145 da CLT."
            },
            {
                texto: "Se você trabalhar em um feriado e não houver folga compensatória, a empresa é obrigada a pagar esse dia em dobro, conforme determina a legislação trabalhista:",
                artigo: "Artigo 9º da Lei nº 605/1949 e Súmula 146 do TST"
            }
        ];

        this.form = document.getElementById('timeEntryForm');
        this.entriesList = document.getElementById('entriesList');
        this.currentTimeEl = document.getElementById('currentTime');
        this.workDateInput = document.getElementById('workDate');
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

    // Função para verificar se uma data é feriado
    isFeriado(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const dayMonth = `${day}/${month}`;
        const fullDate = `${day}/${month}/${year}`;

        // Verifica feriados fixos
        if (this.feriadosFixos.includes(dayMonth)) {
            return true;
        }

        // Verifica feriados móveis
        if (this.feriadosMoveis.includes(fullDate)) {
            return true;
        }

        return false;
    }

    // Função para selecionar uma frase aleatória do "VOCÊ SABIA?"
    getRandomVoceSabia() {
        const randomIndex = Math.floor(Math.random() * this.voceSabiaFrases.length);
        return this.voceSabiaFrases[randomIndex];
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

        this.workDateInput.value = `${year}-${month}-${day}`;
        this.startTimeInput.value = `${hours}:${minutes}`;
        this.endTimeInput.value = `${hours}:${minutes}`;
    }

    updateTime() {
        if (this.currentTimeEl)
            this.currentTimeEl.textContent = new Date().toLocaleString('pt-BR');
    }

    addEntry(e) {
        e.preventDefault();

        const dateStr = this.workDateInput.value;
        const startTimeStr = this.startTimeInput.value;
        const endTimeStr = this.endTimeInput.value;

        // Combinar data com horários
        const s = new Date(`${dateStr}T${startTimeStr}`);
        const eT = new Date(`${dateStr}T${endTimeStr}`);

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
                ${this.entries.map(e => {
            const entryDate = new Date(e.start);
            const isFeriado = this.isFeriado(entryDate);
            const rowClass = isFeriado ? 'feriado-row' : '';

            return `
                    <tr class="${rowClass}">
                        <td>${entryDate.toLocaleDateString('pt-BR')}</td>
                        <td>${this.format(new Date(e.start))}</td>
                        <td>${this.format(new Date(e.end))}</td>
                        <td>${this.formatDur(e.duration)}</td>
                        <td><button class="delete-btn" onclick="tracker.deleteEntry(${e.id})">🗑️</button></td>
                    </tr>`;
        }).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="3"><b>Total de Horas do Mês</b></td><td>${this.formatDur(total)}</td><td></td></tr>
                <tr class="stats-row">
                    <td colspan="5">
                        <div class="work-stats">
                            <span><b>Dias Trabalhados:</b> ${daysWorked} dias</span>
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

        // Obter mês e ano baseado nos registros (pega a data do primeiro registro)
        const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
            'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

        let currentMonth, currentYear;

        if (this.entries.length > 0) {
            // Usa a data do primeiro registro
            const firstEntryDate = new Date(this.entries[0].start);
            currentMonth = monthNames[firstEntryDate.getMonth()];
            currentYear = firstEntryDate.getFullYear();
        } else {
            // Se não houver registros, usa o mês atual
            const now = new Date();
            currentMonth = monthNames[now.getMonth()];
            currentYear = now.getFullYear();
        }

        // Título
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        const title = `FOLHA DE PONTOS DE ${currentMonth} DE ${currentYear}`;
        const titleWidth = pdf.getTextWidth(title);
        const titleX = (pdf.internal.pageSize.width - titleWidth) / 2;
        pdf.text(title, titleX, 15);

        // Preparar dados para a tabela
        const tableData = this.entries.map(e => {
            const entryDate = new Date(e.start);
            return {
                data: [
                    entryDate.toLocaleDateString('pt-BR'),
                    this.format(new Date(e.start)),
                    this.format(new Date(e.end)),
                    this.formatDur(e.duration)
                ],
                isFeriado: this.isFeriado(entryDate)
            };
        });

        // Calcular total
        const total = this.entries.reduce((a, b) => a + b.duration, 0);

        // Criar tabela
        pdf.autoTable({
            head: [
                ['Data', 'Hora de Entrada', 'Hora de Saída', 'Total de Horas']
            ],
            body: tableData.map(entry => entry.data),
            startY: 25,
            theme: 'grid',
            styles: {
                fontSize: 10,
                fontStyle: 'normal',
                cellPadding: 2,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.5,
                lineColor: [128, 128, 128]
            },
            headStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 11,
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 50 },
                2: { cellWidth: 50 },
                3: { cellWidth: 46 }
            },
            didParseCell: function (data) {
                // Colorir linhas de feriados de azul
                if (data.section === 'body') {
                    const rowIndex = data.row.index;
                    if (tableData[rowIndex] && tableData[rowIndex].isFeriado) {
                        data.cell.styles.textColor = [255, 0, 0]; // Vermelho
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        // Adicionar rodapé
        const finalY = pdf.lastAutoTable.finalY + 8;

        // Nome à esquerda
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(name, 14, finalY);

        // Total à direita
        const totalText = `Total de Horas do Mês: ${this.formatDur(total)}`;
        const totalWidth = pdf.getTextWidth(totalText);
        pdf.text(totalText, pdf.internal.pageSize.width - totalWidth - 14, finalY);

        // ===== CAIXA "VOCÊ SABIA?" COM FRASE ALEATÓRIA =====
        const voceSabiaInfo = this.getRandomVoceSabia();

        const boxY = finalY + 10;
        const boxHeight = 20;
        const boxWidth = pdf.internal.pageSize.width - 28;

        // Borda da caixa (sem fundo, apenas contorno)
        pdf.setDrawColor(128, 128, 128); // Cor cinza para a borda
        pdf.setLineWidth(0.5); // Borda fina
        pdf.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2, 'S'); // 'S' = apenas contorno (stroke)

        // Título da caixa
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('VOCÊ SABIA?', 18, boxY + 6);

        // Texto informativo (aleatório)
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        const splitText = pdf.splitTextToSize(voceSabiaInfo.texto, boxWidth - 8);
        pdf.text(splitText, 18, boxY + 11);

        // Artigo da CLT
        pdf.setFont(undefined, 'bold');
        const artigoWidth = pdf.getTextWidth(voceSabiaInfo.artigo);
        const artigoX = pdf.internal.pageSize.width - 19 - artigoWidth;
        pdf.text(voceSabiaInfo.artigo, artigoX, boxY + 17);

        pdf.save(`Folha_Pontos_${currentMonth}_${currentYear}_${name.replace(/\s+/g, '_')}.pdf`);
        this.closePdfModal();
        this.showToast("PDF baixado com sucesso!", "success");
    }

    save() { localStorage.setItem("timeEntries", JSON.stringify(this.entries)); }

    format(d) { return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
    formatDur(ms) {
        const h = Math.floor(ms / 3_600_000);
        const m = Math.floor(ms % 3_600_000 / 60_000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
}

const tracker = new TimeTracker();
