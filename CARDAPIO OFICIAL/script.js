// ==========================================================================
// 1. SELEÇÃO DE ELEMENTOS DO DOM & ESTADO GLOBAL
// ==========================================================================
const contador = document.querySelector('#contador-pedido');
const totalPedidoElemento = document.querySelector('#total-pedido');
const listaCarrinho = document.querySelector('#lista-carrinho');

// Modal e Botões de Controle do Carrinho
const btnAbrirCarrinho = document.querySelector('#btn-abrir-carrinho');
const btnFecharModal = document.querySelector('#btn-fechar-modal');
const modalCarrinho = document.querySelector('#carrinho-modal');
const btnLimpar = document.querySelector('#btn-limpar-pedido');

// Elementos de Frete e Entrega
const checkboxFrete = document.querySelector('#checkbox-frete');
const camposEntrega = document.querySelector('#campos-entrega');

// Elementos de Variação das Tortas
const blocoOpcaoTorta = document.querySelector('#bloco-opcao-torta');
const radiosTorta = document.querySelectorAll('input[name="opcao-torta"]');
const avisoTortaObrigatoria = document.querySelector('#aviso-torta-obrigatoria');

// Elementos de Data de Retirada e Observações
const inputDataRetirada = document.querySelector('#data-retirada');
const avisoPrazoCurto = document.querySelector('#aviso-prazo-curto');
const inputObservacoes = document.querySelector('#observacoes-pedido');
const avisoDataObrigatoria = document.querySelector('#aviso-data-obrigatoria');

// Balões de Feedback do Carrinho
const tooltipLembrete = document.querySelector('#tooltip-carrinho'); // Laranja (1 min)
const balaoItemAdicionado = document.querySelector('#toast-adicionado'); // Azul (só no clique)

// Estado salvo no navegador (localStorage)
let carrinho = carregarCarrinho();
let opcaoTortaSelecionada = localStorage.getItem('opcaoTortaSantoForno') || '';

// ==========================================================================
// 2. PERSISTÊNCIA DE DADOS (LOCALSTORAGE)
// ==========================================================================
function salvarCarrinho() {
  localStorage.setItem('carrinhoSantoForno', JSON.stringify(carrinho));
  localStorage.setItem('opcaoTortaSantoForno', opcaoTortaSelecionada);
}

function carregarCarrinho() {
  const carrinhoSalvo = localStorage.getItem('carrinhoSantoForno');
  return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : {};
}

// ==========================================================================
// 3. CONTROLE DO MODAL DO CARRINHO & MENU MOBILE
// ==========================================================================
if (btnAbrirCarrinho) {
  btnAbrirCarrinho.addEventListener('click', () => {
    if (modalCarrinho) modalCarrinho.classList.remove('escondido');
  });
}

if (btnFecharModal) {
  btnFecharModal.addEventListener('click', () => {
    if (modalCarrinho) modalCarrinho.classList.add('escondido');
  });
}

if (modalCarrinho) {
  modalCarrinho.addEventListener('click', (event) => {
    if (event.target === modalCarrinho) {
      modalCarrinho.classList.add('escondido');
    }
  });
}

// Fecha o menu hambúrguer automaticamente ao clicar em qualquer link
const menuToggle = document.querySelector('#menu-toggle');
document.querySelectorAll('.menu-navegacao a').forEach((link) => {
  link.addEventListener('click', () => {
    if (menuToggle) menuToggle.checked = false;
  });
});

// ==========================================================================
// 4. FEEDBACK VISUAL (BALÃO AZUL NO CLIQUE + LEMBRETE LARANJA DE 1 MINUTO)
// ==========================================================================
let timerEsconderLembrete;
let timerEsconderAdicionado;

// A) Acionado IMEDIATAMENTE e EXCLUSIVAMENTE quando clica em "Adicionar"
function dispararAvisoItemAdicionado() {
  // Pulsa o ícone do carrinho
  if (btnAbrirCarrinho) {
    btnAbrirCarrinho.classList.remove('carrinho-pulsando');
    void btnAbrirCarrinho.offsetWidth; // Força reinício da animação em cliques rápidos
    btnAbrirCarrinho.classList.add('carrinho-pulsando');
  }

  // Mostra o balão azul na mesma posição do balão inicial e esconde após 1,5s
  if (balaoItemAdicionado) {
    balaoItemAdicionado.classList.remove('escondido');

    clearTimeout(timerEsconderAdicionado);
    timerEsconderAdicionado = setTimeout(() => {
      balaoItemAdicionado.classList.add('escondido');
    }, 1500);
  }
}

// B) Balão laranja periódico ("Confira seu pedido aqui" a cada 1 minuto)
function mostrarLembretePeriodico() {
  if (!tooltipLembrete) return;

  tooltipLembrete.classList.remove('escondido');

  clearTimeout(timerEsconderLembrete);
  timerEsconderLembrete = setTimeout(() => {
    tooltipLembrete.classList.add('escondido');
  }, 5000);
}

if (tooltipLembrete) {
  setTimeout(mostrarLembretePeriodico, 3000);
  setInterval(mostrarLembretePeriodico, 60000);

  if (btnAbrirCarrinho) {
    btnAbrirCarrinho.addEventListener('click', () => {
      clearTimeout(timerEsconderLembrete);
      tooltipLembrete.classList.add('escondido');
    });
  }
}

// ==========================================================================
// 5. RENDERIZAÇÃO DO CARRINHO E CÁLCULO DE TOTAIS
// ==========================================================================
function atualizarCarrinho() {
  salvarCarrinho();
  if (!listaCarrinho) return;

  listaCarrinho.innerHTML = '';

  let totalItens = 0;
  let valorTotal = 0;
  let temTortaNoCarrinho = false;

  const nomesProdutos = Object.keys(carrinho);

  // Estado vazio
  if (nomesProdutos.length === 0) {
    listaCarrinho.innerHTML = '<li class="item-vazio">Nenhum item adicionado ainda.</li>';
    if (contador) contador.textContent = 0;
    if (totalPedidoElemento) totalPedidoElemento.textContent = 'R$ 0,00';
    if (blocoOpcaoTorta) blocoOpcaoTorta.classList.add('escondido');
    return;
  }

  // Desenha cada item adicionado
  nomesProdutos.forEach((nome) => {
    const item = carrinho[nome];

    if (item.categoria === 'tortas') {
      temTortaNoCarrinho = true;
    }

    // Adicional de corte (+R$ 5,00 por unidade) apenas para Pães Italianos
    const adicionalCorte = (item.categoria === 'paes' && item.cortado) ? (5 * item.quantidade) : 0;
    const subtotal = (item.preco * item.quantidade) + adicionalCorte;

    totalItens += item.quantidade;
    valorTotal += subtotal;

    const precoUnitarioFormatado = 'R$ ' + item.preco.toFixed(2).replace('.', ',');
    const subtotalFormatado = 'R$ ' + subtotal.toFixed(2).replace('.', ',');

    const htmlCortePao = item.categoria === 'paes'
      ? `<label class="opcao-corte-pao">
           <input type="checkbox" class="checkbox-cortar-pao" data-nome="${nome}" ${item.cortado ? 'checked' : ''} />
           <span>Pão cortado (+R$ 5,00/un.)</span>
         </label>`
      : '';

    const li = document.createElement('li');
    li.className = 'item-carrinho-linha';
    li.innerHTML = `
      <div class="item-coluna-detalhes">
        <span class="nome-produto-carrinho item-info-nome">${nome}</span>
        <span class="item-info-unitario">${precoUnitarioFormatado} un. × ${item.quantidade}</span>
        ${htmlCortePao}
      </div>

      <div class="item-coluna-acoes">
        <span class="item-info-subtotal">${subtotalFormatado}</span>
        <div class="item-controles">
          <button class="btn-qtd btn-diminuir" data-nome="${nome}">-</button>
          <span class="qtd-numero">${item.quantidade}</span>
          <button class="btn-qtd btn-aumentar" data-nome="${nome}">+</button>
          <button class="btn-remover-item" data-nome="${nome}">✕</button>
        </div>
      </div>
    `;

    listaCarrinho.appendChild(li);
  });

  // Exibe/oculta seleção obrigatória de retirada para tortas
  if (blocoOpcaoTorta) {
    if (temTortaNoCarrinho) {
      blocoOpcaoTorta.classList.remove('escondido');
      radiosTorta.forEach((radio) => {
        radio.checked = (radio.value === opcaoTortaSelecionada);
      });
      if (avisoTortaObrigatoria) {
        avisoTortaObrigatoria.classList.toggle('escondido', Boolean(opcaoTortaSelecionada));
      }
    } else {
      blocoOpcaoTorta.classList.add('escondido');
      opcaoTortaSelecionada = '';
    }
  }

  // Soma taxa fixa de entrega em Serra Negra
  if (checkboxFrete && checkboxFrete.checked) {
    valorTotal += 5;
  }

  if (contador) contador.textContent = totalItens;
  if (totalPedidoElemento) {
    totalPedidoElemento.textContent = 'R$ ' + valorTotal.toFixed(2).replace('.', ',');
  }
}

// ==========================================================================
// 6. EVENTOS DE INTERAÇÃO COM PRODUTOS E CARRINHO
// ==========================================================================

// Delegação de clique para TODOS os botões "Adicionar" do cardápio
document.addEventListener('click', (event) => {
  const botaoAdicionar = event.target.closest('.btn-adicionar');
  if (!botaoAdicionar) return;

  const produto = botaoAdicionar.closest('.produto');
  if (!produto) return;

  const nome = produto.querySelector('.nome-produto').textContent.trim();
  const precoTexto = produto.querySelector('.preco').textContent;
  const precoNumerico = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim());

  const secaoPai = produto.closest('.secao-cardapio');
  const categoria = secaoPai ? secaoPai.id : '';

  if (carrinho[nome]) {
    carrinho[nome].quantidade += 1;
  } else {
    carrinho[nome] = {
      preco: precoNumerico,
      quantidade: 1,
      categoria: categoria,
      cortado: false
    };
  }

  atualizarCarrinho();
  dispararAvisoItemAdicionado(); // Dispara o balão azul a CADA clique em qualquer item!
});

// Controles +, -, remover (✕) e checkbox de corte dentro do modal
if (listaCarrinho) {
  listaCarrinho.addEventListener('click', (event) => {
    const alvo = event.target;
    const nome = alvo.getAttribute('data-nome');
    if (!nome || !carrinho[nome]) return;

    if (alvo.classList.contains('btn-aumentar')) {
      carrinho[nome].quantidade += 1;
      atualizarCarrinho();
    } else if (alvo.classList.contains('btn-diminuir')) {
      carrinho[nome].quantidade -= 1;
      if (carrinho[nome].quantidade <= 0) delete carrinho[nome];
      atualizarCarrinho();
    } else if (alvo.classList.contains('btn-remover-item')) {
      delete carrinho[nome];
      atualizarCarrinho();
    }
  });

  listaCarrinho.addEventListener('change', (event) => {
    const alvo = event.target;
    if (alvo.classList.contains('checkbox-cortar-pao')) {
      const nome = alvo.getAttribute('data-nome');
      if (nome && carrinho[nome]) {
        carrinho[nome].cortado = alvo.checked;
        atualizarCarrinho();
      }
    }
  });
}

// Opção obrigatória das tortas
radiosTorta.forEach((radio) => {
  radio.addEventListener('change', (event) => {
    opcaoTortaSelecionada = event.target.value;
    atualizarCarrinho();
  });
});

// Frete Serra Negra
if (checkboxFrete) {
  checkboxFrete.addEventListener('change', () => {
    if (camposEntrega) {
      camposEntrega.classList.toggle('escondido', !checkboxFrete.checked);
    }
    atualizarCarrinho();
  });
}

// Botão Limpar Pedido
if (btnLimpar) {
  btnLimpar.addEventListener('click', () => {
    carrinho = {};
    opcaoTortaSelecionada = '';
    localStorage.removeItem('carrinhoSantoForno');
    localStorage.removeItem('opcaoTortaSantoForno');
    localStorage.removeItem('dataRetiradaSantoForno');
    localStorage.removeItem('observacoesSantoForno');

    if (checkboxFrete) checkboxFrete.checked = false;
    if (camposEntrega) camposEntrega.classList.add('escondido');
    radiosTorta.forEach((radio) => { radio.checked = false; });

    if (inputDataRetirada) inputDataRetirada.value = '';
    if (avisoPrazoCurto) avisoPrazoCurto.classList.add('escondido');
    if (inputObservacoes) inputObservacoes.value = '';

    atualizarCarrinho();
  });
}

// ==========================================================================
// 7. DATA DE RETIRADA (BLOQUEIO PASSADO + AVISO < 3 DIAS) E OBSERVAÇÕES
// ==========================================================================
function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function verificarPrazoData(dataSelecionadaStr) {
  if (!avisoPrazoCurto) return;

  if (!dataSelecionadaStr) {
    avisoPrazoCurto.classList.add('escondido');
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [ano, mes, dia] = dataSelecionadaStr.split('-').map(Number);
  const dataEscolhida = new Date(ano, mes - 1, dia);
  dataEscolhida.setHours(0, 0, 0, 0);

  const diferencaDias = Math.round((dataEscolhida - hoje) / (1000 * 60 * 60 * 24));

  if (diferencaDias >= 0 && diferencaDias < 3) {
    avisoPrazoCurto.classList.remove('escondido');
  } else {
    avisoPrazoCurto.classList.add('escondido');
  }
}

if (inputDataRetirada) {
  inputDataRetirada.min = obterDataHojeISO();

  inputDataRetirada.addEventListener('click', () => {
    if (typeof inputDataRetirada.showPicker === 'function') {
      inputDataRetirada.showPicker();
    }
  });

  const dataSalva = localStorage.getItem('dataRetiradaSantoForno');
  if (dataSalva && dataSalva >= inputDataRetirada.min) {
    inputDataRetirada.value = dataSalva;
    verificarPrazoData(dataSalva);
  }

  inputDataRetirada.addEventListener('change', (event) => {
    const valorData = event.target.value;
    localStorage.setItem('dataRetiradaSantoForno', valorData);
    verificarPrazoData(valorData);
    if (valorData) {
      if (avisoDataObrigatoria) avisoDataObrigatoria.classList.add('escondido');
      inputDataRetirada.classList.remove('input-invalido');
    }
  });
}

if (inputObservacoes) {
  const obsSalva = localStorage.getItem('observacoesSantoForno');
  if (obsSalva) inputObservacoes.value = obsSalva;

  inputObservacoes.addEventListener('input', (event) => {
    localStorage.setItem('observacoesSantoForno', event.target.value);
  });
}

// ==========================================================================
// 8. ENVIAR PEDIDO FORMATADO PARA O WHATSAPP
// ==========================================================================
const btnEnviarWhatsapp = document.querySelector('#btn-enviar-whatsapp');

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

if (btnEnviarWhatsapp) {
  btnEnviarWhatsapp.addEventListener('click', () => {
    const nomesProdutos = Object.keys(carrinho);

    // 1. Validação: carrinho vazio
    if (nomesProdutos.length === 0) {
      alert('Seu carrinho está vazio! Adicione pelo menos um item do cardápio antes de enviar o pedido.');
      return;
    }

   // 2. Validação: se houver torta, exige selecionar congelada ou pronta
    const temTorta = nomesProdutos.some((nome) => carrinho[nome].categoria === 'tortas');
    if (temTorta && !opcaoTortaSelecionada) {
      alert('Por favor, selecione como deseja retirar sua(s) torta(s): Congelada ou Pronta para consumo.');
      return;
    }

    // 2.1. Validação: data de retirada/entrega obrigatória
    if (!inputDataRetirada || !inputDataRetirada.value) {
      if (avisoDataObrigatoria) avisoDataObrigatoria.classList.remove('escondido');
      if (inputDataRetirada) {
        inputDataRetirada.classList.add('input-invalido');
        inputDataRetirada.focus();
      }
      alert('Por favor, selecione a data desejada para retirada ou entrega antes de enviar o pedido.');
      return;
    }


    // 3. Monta o cabeçalho da mensagem
    let mensagem = 'Olá, Santo Forno! Gostaria de fazer o seguinte pedido:\n\n';
    mensagem += '🛒 *ITENS DO PEDIDO:*\n';

    let valorTotal = 0;

    nomesProdutos.forEach((nome) => {
      const item = carrinho[nome];
      const adicionalCorte = (item.categoria === 'paes' && item.cortado) ? (5 * item.quantidade) : 0;
      const subtotal = (item.preco * item.quantidade) + adicionalCorte;
      valorTotal += subtotal;

      const subtotalFormatado = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
      const detalheCorte = (item.categoria === 'paes' && item.cortado) ? ' _(Pão cortado)_' : '';

      mensagem += `• ${item.quantidade}x ${nome}${detalheCorte} — ${subtotalFormatado}\n`;
    });

    // 4. Detalhe da Torta (se houver)
    if (temTorta && opcaoTortaSelecionada) {
      const textoTorta = opcaoTortaSelecionada === 'congelada'
        ? 'Retirar torta congelada'
        : 'Retirar torta pronta para consumo';
      mensagem += `\n🥧 *Preparo da Torta:* ${textoTorta}\n`;
    }

    // 5. Entrega ou Retirada
    if (checkboxFrete && checkboxFrete.checked) {
      valorTotal += 5;
      const nomeRecebedor = document.querySelector('#nome-recebedor')?.value.trim() || 'Não informado';
      const enderecoEntrega = document.querySelector('#endereco-entrega')?.value.trim() || 'Não informado';

      mensagem += `\n🚚 *Entrega:* Frete Serra Negra (+R$ 5,00)\n`;
      mensagem += `• *Recebedor:* ${nomeRecebedor}\n`;
      mensagem += `• *Endereço:* ${enderecoEntrega}\n`;
    } else {
      mensagem += `\n🏠 *Modalidade:* Retirada no local (ou frete a consultar)\n`;
    }

    // 6. Data desejada (se preenchida)
    if (inputDataRetirada && inputDataRetirada.value) {
      mensagem += `📅 *Data desejada:* ${formatarDataBR(inputDataRetirada.value)}\n`;
    }

    // 7. Observações (se preenchidas)
    if (inputObservacoes && inputObservacoes.value.trim()) {
      mensagem += `📝 *Observações:* ${inputObservacoes.value.trim()}\n`;
    }

    // 8. Total Geral
    const totalGeralFormatado = 'R$ ' + valorTotal.toFixed(2).replace('.', ',');
    mensagem += `\n💰 *TOTAL ESTIMADO:* ${totalGeralFormatado}\n\n`;
    mensagem += '_Aguardo a confirmação da disponibilidade e chave Pix!_';

    // 9. Codifica o texto e abre o WhatsApp da Santo Forno
    const numeroWhatsapp = '5519999213704';
    const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsapp, '_blank');
  });
}

// ==========================================================================
// 8. INICIALIZAÇÃO
// ==========================================================================
atualizarCarrinho();