(function () {
  'use strict';

  // Tribal Wars styling constants
  const TW_STYLE = {
    background: '#1a1a1a',
    border: '1px solid #5d4a30',
    text: '#e2d4b0',
    buttonBg: '#5d4a30',
    buttonHover: '#7a6740',
    inputBg: '#2a2a2a',
    success: '#6d8c21',
    error: '#a83535',
    font: '13px Verdana, Arial, sans-serif',
    headerBg: '#3a2a1a',
  };

  let exportPanel = null;
  let isProcessing = false;

  // Remove elementos existentes para evitar duplicação
  document.querySelectorAll('#twExportPanel, #twExportToggle').forEach((el) => el.remove());

  // Helper: Cria um elemento DOM com estilos personalizados
  const createElement = (tag, styles = {}) => {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    return el;
  };

  // Helper: Exibe uma mensagem de status
  const showStatus = (message, isError = false) => {
    const status = exportPanel.querySelector('.status');
    status.textContent = message;
    status.style.color = isError ? TW_STYLE.error : TW_STYLE.success;
    status.style.display = 'block';
    setTimeout(() => (status.style.display = 'none'), 2000);
  };

  // Helper: Extrai nomes dos membros a partir das linhas da tabela
  const getMemberNames = () => {
    const rows = document.querySelectorAll('.row_a, .row_b');
    if (!rows.length) throw new Error('No member rows found');
    return Array.from(rows)
      .map((row) => {
        const name = row.querySelector('td a')?.textContent?.trim() || '';
        return name.startsWith('-') ? `'${name}` : name;
      })
      .filter((name) => name.length > 0);
  };

  // Ação: Extrai e exibe os nomes dos membros
  const extractMembers = (textarea) => {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const members = getMemberNames();
      if (!members.length) throw new Error('No members found');
      textarea.value = members.join('\n');
      showStatus(`${members.length} members extracted successfully`);
    } catch (error) {
      showStatus(error.message, true);
    } finally {
      isProcessing = false;
    }
  };

  // UI: Cria o cabeçalho com botão de fechar
  const createHeader = (onClose) => {
    const header = createElement('div', {
      background: TW_STYLE.headerBg,
      padding: '8px',
      margin: '-12px -12px 12px -12px',
      borderBottom: TW_STYLE.border,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    });
    const title = createElement('strong', { color: TW_STYLE.text });
    title.textContent = 'TRIBE MEMBER EXPORT';
    const closeBtn = createElement('button', {
      background: 'none',
      border: 'none',
      color: TW_STYLE.text,
      fontSize: '16px',
      cursor: 'pointer',
    });
    closeBtn.textContent = '×';
    closeBtn.onclick = onClose;
    header.append(title, closeBtn);
    return header;
  };

  // UI: Cria a textarea para exibir a lista de membros
  const createTextarea = () =>
    createElement('textarea', {
      width: '100%',
      height: '160px',
      background: TW_STYLE.inputBg,
      border: TW_STYLE.border,
      color: TW_STYLE.text,
      padding: '8px',
      marginBottom: '12px',
      resize: 'vertical',
      font: '12px Verdana, sans-serif',
      boxSizing: 'border-box',
    });

  // UI: Cria um botão estilizado
  const createTWButton = (text, action) => {
    const btn = createElement('button', {
      background: TW_STYLE.buttonBg,
      border: TW_STYLE.border,
      color: TW_STYLE.text,
      padding: '6px 12px',
      cursor: 'pointer',
      font: TW_STYLE.font,
      marginRight: '8px',
      transition: 'background 0.2s',
    });
    btn.textContent = text;
    btn.onclick = action;
    btn.onmouseover = () => (btn.style.background = TW_STYLE.buttonHover);
    btn.onmouseout = () => (btn.style.background = TW_STYLE.buttonBg);
    return btn;
  };

  // UI: Cria os botões de controle
  const createControls = (textarea) => {
    const controls = createElement('div', { display: 'flex', justifyContent: 'space-between' });
    controls.append(
      createTWButton('Extract Names', () => extractMembers(textarea)),
      createTWButton('Copy List', () => {
        navigator.clipboard
          .writeText(textarea.value)
          .then(() => showStatus('List copied to clipboard'))
          .catch(() => showStatus('Copy failed', true));
      }),
      createTWButton('Clear', () => (textarea.value = '')),
    );
    return controls;
  };

  // UI: Cria o display de status
  const createStatus = () => {
    const status = createElement('div', { display: 'none', fontSize: '12px', marginTop: '8px' });
    status.className = 'status';
    return status;
  };

  // Main: Constrói e inicializa o painel de exportação
  const buildExportPanel = () => {
    const toggleBtn = createElement('button', {
      position: 'fixed',
      top: '10px',
      right: '240px',
      zIndex: '99999',
      background: TW_STYLE.buttonBg,
      border: TW_STYLE.border,
      color: TW_STYLE.text,
      padding: '5px 12px',
      cursor: 'pointer',
      font: TW_STYLE.font,
      borderRadius: '3px',
    });
    toggleBtn.textContent = 'Member Exporter';
    toggleBtn.id = 'twExportToggle';

    exportPanel = createElement('div', {
      position: 'fixed',
      top: '40px',
      right: '240px',
      zIndex: '99998',
      background: TW_STYLE.background,
      border: TW_STYLE.border,
      padding: '12px',
      width: '280px',
      borderRadius: '4px',
      display: 'none',
    });
    exportPanel.id = 'twExportPanel';

    const header = createHeader(() => (exportPanel.style.display = 'none'));
    const textarea = createTextarea();
    const controls = createControls(textarea);
    const status = createStatus();

    exportPanel.append(header, textarea, controls, status);
    toggleBtn.onclick = () => {
      exportPanel.style.display = exportPanel.style.display === 'none' ? 'block' : 'none';
    };

    document.body.append(toggleBtn, exportPanel);
  };

  // Função principal para inicializar o script
  function main() {
    buildExportPanel();
  }

  // Garante que o script execute após o carregamento completo do DOM
  if (window.jQuery) {
    $(document).ready(main);
  } else {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      main();
    } else {
      window.addEventListener('DOMContentLoaded', main);
    }
  }
})();
