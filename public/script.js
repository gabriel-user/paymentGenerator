document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileElem = document.getElementById('csvFile');
    const fileSelect = document.getElementById('fileSelect');
    const fileInfo = document.getElementById('file-info');
    const uploadButton = document.getElementById('uploadButton');
    const loadingDiv = document.getElementById('loading');

    let currentFile = null;

    // Previne o comportamento padrão de arrastar e soltar
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Destaca a área de drop quando um arquivo é arrastado sobre ela
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    // Remove o destaque quando o arquivo sai da área de drop
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Lida com o arquivo solto
    dropArea.addEventListener('drop', handleDrop, false);

    // Abre o seletor de arquivo quando o botão é clicado
    fileSelect.addEventListener('click', () => {
        fileElem.click();
    });

    // Lida com a seleção de arquivo via input
    fileElem.addEventListener('change', (e) => handleFiles(e.target.files), false);

    // Adiciona evento de clique ao botão de upload
    uploadButton.addEventListener('click', uploadCSV);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            validateFile(files[0]);
        }
    }

    function validateFile(file) {
        if (file.type !== 'text/csv') {
            fileInfo.textContent = 'Por favor, selecione um arquivo CSV válido.';
            uploadButton.style.display = 'none';
            currentFile = null;
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            fileInfo.textContent = 'O arquivo é muito grande. O tamanho máximo é 5MB.';
            uploadButton.style.display = 'none';
            currentFile = null;
            return;
        }

        currentFile = file;
        fileInfo.textContent = `Arquivo selecionado: ${file.name} (${formatBytes(file.size)})`;
        uploadButton.style.display = 'inline-block';
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async function uploadCSV() {
        if (!currentFile) {
            alert('Por favor, selecione um arquivo CSV.');
            return;
        }

        const formData = new FormData();
        formData.append('csvFile', currentFile);

        try {
            loadingDiv.style.display = 'block';
            uploadButton.style.display = 'none';
            dropArea.style.display = 'none'; // Oculta a área de drop
            fileInfo.style.display = 'none'; // Oculta a informação do arquivo

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar o arquivo');
            }

            const processedData = await response.json();
            displayProcessedData(processedData);
        } catch (error) {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao processar o arquivo.');
            resetUpload(); // Reseta o upload em caso de erro
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    function displayProcessedData(data) {
        const container = document.getElementById('reportContainer');
        container.innerHTML = '<h2>Dados Processados</h2>';

        const combinedText = data.map((text, index) => {
            return `------------ Pagamento ${index + 1}:\n\n${text}`;
        }).join('\n\n');

        const textArea = document.createElement('textarea');
        textArea.value = combinedText;
        textArea.rows = 30;
        textArea.cols = 80;
        textArea.readOnly = true;

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copiar Tudo';
        copyButton.onclick = () => {
            textArea.select();
            document.execCommand('copy');
        };

        const generateNewButton = document.createElement('button');
        generateNewButton.textContent = 'Gerar outro pagamento';
        generateNewButton.onclick = resetUpload;

        const buttonContainer = document.createElement('div');
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(generateNewButton);

        container.appendChild(textArea);
        container.appendChild(buttonContainer);
    }

    function resetUpload() {
        fileElem.value = '';
        fileInfo.textContent = '';
        uploadButton.style.display = 'none';
        const reportContainer = document.getElementById('reportContainer');
        reportContainer.innerHTML = '';
        loadingDiv.style.display = 'none';
        currentFile = null;
        
        // Exibe novamente a área de drop e a informação do arquivo
        dropArea.style.display = 'flex';
        fileInfo.style.display = 'block';
    }
});