// ==========================================================================
// 1. SELEÇÃO DE ELEMENTOS & ESTADO GLOBAL
// ==========================================================================
const produtos = document.querySelectorAll('.produto');
const contador = document.querySelector('#contador-pedido');
const totalPedidoElemento = document.querySelector('#total-pedido');
const listaCarrinho = document.querySelector('#lista-carrinho');

// Modal e Botões de Controle
const btnAbrirCarrinho = document.querySelector('#btn-abrir-carrinho');
const btnFecharModal = document.querySelector('#btn-fechar-modal');
const modalCarrinho = document.querySelector('#carrinho-modal');
const btnLimpar = document.querySelector('#btn-limpar-pedido');

// Elementos de Frete e Entrega
const checkboxFrete = document.querySelector('#checkbox-frete');
const camposEntrega = document.querySelector('#campos-entrega');

// Tenta carregar o carrinho do localStorage ao iniciar; se não houver nada, inicia objeto vazio {}
let carrinho = carregarCarrinho();

// ==========================================================================
// 2. FUNÇÕES DE LOCALSTORAGE (GRAVAR E LER)
// ==========================================================================
function salvarCarrinho() {
  localStorage.setItem('carrinhoSantoForno', JSON.stringify(carrinho));
}

function carregarCarrinho() {
  const carrinhoSalvo = localStorage.getItem('carrinhoSantoForno');
  if (carrinhoSalvo) {
    return JSON.parse(carrinhoSalvo);
  }
  return {};
}

// ==========================================================================
// 3. CONTROLE DE ABERTURA DO MODAL
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

// ==========================================================================
// 4. FUNÇÃO PRINCIPAL: DESENHAR O CARRINHO E RECALCULAR TOTAL
// ==========================================================================
function atualizarCarrinho() {
  salvarCarrinho();

  listaCarrinho.innerHTML = '';

  let totalItens = 0;
  let valorTotal = 0;

  const nomesProdutos = Object.keys(carrinho);

  // Se o carrinho estiver vazio
  if (nomesProdutos.length === 0) {
    listaCarrinho.innerHTML = '<li class="item-vazio">Nenhum item adicionado ainda.</li>';
    contador.textContent = 0;
    if (totalPedidoElemento) totalPedidoElemento.textContent = 'R$ 0,00';
    return;
  }

  // Percorre cada produto salvo no objeto carrinho
  nomesProdutos.forEach((nome) => {
    const item = carrinho[nome];
    const subtotal = item.preco * item.quantidade;

    totalItens += item.quantidade;
    valorTotal += subtotal;

    const precoUnitarioFormatado = 'R$ ' + item.preco.toFixed(2).replace('.', ',');
    const subtotalFormatado = 'R$ ' + subtotal.toFixed(2).replace('.', ',');

    const li = document.createElement('li');
    li.className = 'item-carrinho-linha';
    li.innerHTML = `
      <div class="item-coluna-detalhes">
        <span class="nome-produto-carrinho item-info-nome">${nome}</span>
        <span class="item-info-unitario">${precoUnitarioFormatado} un. × ${item.quantidade}</span>
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

  // Soma R$ 5,00 se a opção de Frete Serra Negra estiver marcada
  if (checkboxFrete && checkboxFrete.checked) {
    valorTotal += 5;
  }

  contador.textContent = totalItens;
  if (totalPedidoElemento) {
    totalPedidoElemento.textContent = 'R$ ' + valorTotal.toFixed(2).replace('.', ',');
  }
}

// ==========================================================================
// 5. EVENTOS DE CLIQUE (ADICIONAR, +, -, REMOVER, LIMPAR E FRETE)
// ==========================================================================

// Adicionar produto a partir do cardápio principal (incluindo tortas)
produtos.forEach((produto) => {
  const botao = produto.querySelector('.btn-adicionar');
  if (botao) {
    botao.addEventListener('click', () => {
      const nome = produto.querySelector('.nome-produto').textContent;
      const precoTexto = produto.querySelector('.preco').textContent;
      const precoNumerico = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim());

      if (carrinho[nome]) {
        carrinho[nome].quantidade += 1;
      } else {
        carrinho[nome] = {
          preco: precoNumerico,
          quantidade: 1
        };
      }

      atualizarCarrinho();
    });
  }
});

// Botões +, - e ✕ dentro da lista do modal
listaCarrinho.addEventListener('click', (event) => {
  const alvo = event.target;
  const nome = alvo.getAttribute('data-nome');

  if (!nome || !carrinho[nome]) return;

  if (alvo.classList.contains('btn-aumentar')) {
    carrinho[nome].quantidade += 1;
  } else if (alvo.classList.contains('btn-diminuir')) {
    carrinho[nome].quantidade -= 1;
    if (carrinho[nome].quantidade <= 0) {
      delete carrinho[nome];
    }
  } else if (alvo.classList.contains('btn-remover-item')) {
    delete carrinho[nome];
  }

  atualizarCarrinho();
});

// Botão Limpar Pedido
if (btnLimpar) {
  btnLimpar.addEventListener('click', () => {
    carrinho = {};
    localStorage.removeItem('carrinhoSantoForno');

    // Desmarca o frete e esconde os campos de endereço ao limpar o pedido
    if (checkboxFrete) checkboxFrete.checked = false;
    if (camposEntrega) camposEntrega.classList.add('escondido');

    atualizarCarrinho();
  });
}

// Mostra/esconde os campos de endereço e recalcula o total ao marcar o frete
if (checkboxFrete) {
  checkboxFrete.addEventListener('change', () => {
    if (camposEntrega) {
      if (checkboxFrete.checked) {
        camposEntrega.classList.remove('escondido');
      } else {
        camposEntrega.classList.add('escondido');
      }
    }
    atualizarCarrinho();
  });
}

// Desenha o carrinho imediatamente ao carregar a página
atualizarCarrinho();