import React from "react";
import { Modal, Button, FormControl } from "react-bootstrap";
import MaskedInput from "react-text-mask";
import Cards from "react-credit-cards";
import "react-credit-cards/es/styles-compiled.css";
import cookie from "react-cookies";

export class Finish extends React.Component {
  state = {
    cliente: [],
    compra: [],
    produtos: [],
    showC: false,
    showB: false,
    showF: false,
    pedido: false,
    t: 0,
    card: {
      number: "",
      name: "",
      expiry: "",
      cvc: "",
      focused: ""
    },
    entrega: {
      nome: "",
      cpf: "",
      rua: "",
      casa: "",
      bairro: "",
      cidade: "",
      uf: "",
      cep: ""
    }
  };

  componentWillMount() {
    this.getProdutos();
    const { entrega } = this.state;

    if (cookie.load("usuario")) {
      let valor = cookie.load("usuario");
      this.setState({ cliente: valor }, () => {
        this.setState({
          entrega: { ...entrega, cep: valor[0].cep, nome: valor[0].nome }
        });
      });
    }
    if (cookie.load("compra")) {
      let value = cookie.load("compra");
      this.setState({ compra: value });
    }
  }

  getProdutos = _ => {
    fetch(`http://localhost:4000/show?table=produtos`)
      .then(response => response.json())
      .then(response => this.setState({ produtos: response.data }))
      .catch(err => console.error(err));
  };

  Total = _ => {
    const { compra, produtos } = this.state;

    let total = 0;

    for (let i = 0; i < produtos.length; i++) {
      for (let u = 0; u < compra.length; u++) {
        if (compra[u].id === produtos[i].id) {
          total += produtos[i].preco * compra[u].quantidade;
        }
      }
    }

    return total.toFixed(2);
  };

  renderCompra = compra => {
    const { produtos } = this.state;

    let item;
    let bool = false;

    for (let i = 0; i < produtos.length; i++) {
      if (compra.id === produtos[i].id) {
        item = produtos[i];
        bool = true;
      }
    }
    if (bool) {
      let total = (compra.quantidade * item.preco).toFixed(2);
      return (
        <tr key={compra.id} className="prodi">
          <th className="center">
            <img
              src={`http://localhost:3000/uploads/${item.img}`}
              alt={item.nome}
              className="imgFinish"
            />
          </th>
          <th className="center">
            <div className="nameFinish">
              <span>{item.nome}</span>
            </div>
          </th>
          <th className="center">
            <span>{compra.quantidade}</span>
          </th>
          <th className="center">
            <span>R${item.preco.toFixed(2)}</span>
          </th>
          <th className="center">
            <span>R${total}</span>
          </th>
        </tr>
      );
    }
  };

  handleCloseC = () => {
    this.setState({ showC: false });
  };
  handleCloseF = () => {
    this.setState({ showF: false });
  };
  handleCloseB = () => {
    this.setState({ showB: false });
  };

  Parcelas = _ => {
    const { compra, produtos } = this.state;

    let select = [];

    let total = 0;

    for (let i = 0; i < produtos.length; i++) {
      for (let u = 0; u < compra.length; u++) {
        if (compra[u].id === produtos[i].id) {
          total += produtos[i].preco * compra[u].quantidade;
        }
      }
    }

    for (let i = 1; i < 12; i++) {
      select.push(
        <option key={i}>
          {i}x R$ {(total / i).toFixed(2)}
        </option>
      );
    }

    return select;
  };

  Enviar = _ => {
    const { cliente, compra, produtos, entrega } = this.state;

    let total = 0;
    let tot = document.getElementById("total").value;
    let id_cliente = cliente[0].id;
    let dataC = new Date();
    let d = dataC.getDate();
    let m = dataC.getMonth();
    let y = dataC.getFullYear();
    let data = `${d}/${m + 1}/${y}`;
    let qnt = "";
    let id = "";
    let a = compra.length;
    let idProd = 0;

    for (let u = 0; u < compra.length; u++) {
      id += `${compra[u].id}${u + 1 !== a ? "," : ""}`;
      qnt += `${compra[u].quantidade}${u + 1 !== a ? "," : ""}`;
    }

    let bool = true;

    //erro nas quantidades, ta subtraindo apenas um
    for (let i = 0; i < produtos.length; i++) {
      for (let u = 0; u < compra.length; u++) {
        if (compra[u].id === produtos[i].id) {
          total = produtos[i].quantidade - compra[u].quantidade;
          idProd = compra[u].id;
          if (total < 0) {
            alert("Estoque não possui a quantidade desejada");
            bool = false;
          } else {
            fetch(
              `http://localhost:4000/update?table=produtos&alt=quantidade="${total}"&id="${idProd}"`
            )
              .then(this.setState({ show: false }))
              .then(this.props.handleChangePage(""))
              .then(this.props.changeQnt(0))
              .then(cookie.remove("compra", { path: "/" }))
              .then(cookie.remove("carrinho", { path: "/" }))
              .catch(err => console.error(err));
          }
        }
      }
    }
    if (bool) {
      fetch(
        `http://localhost:4000/add?table=compras&campos=preco,idCliente,idProdutos,qntProdutos,data,estado&valores='${tot}','${id_cliente}','${id}','${qnt}','${data}','Pedido Pendente'`
      )
        .then(
          this.setState({
            entrega: {
              ...entrega,
              cpf: "",
              rua: "",
              casa: "",
              bairro: "",
              cidade: "",
              uf: ""
            }
          })
        )
        .catch(err => console.error(err));
    }
  };

  EnviarBoleto = _ => {
    const { cliente, compra, produtos, entrega } = this.state;

    let total = 0;
    let tot = document.getElementById("total").value;
    let desconto = (10 * tot) / 100;
    let TotaldaCompra = tot - desconto;
    let id_cliente = cliente[0].id;
    let dataC = new Date();
    let d = dataC.getDate();
    let m = dataC.getMonth();
    let y = dataC.getFullYear();
    let data = `${d}/${m + 1}/${y}`;
    let qnt = "";
    let id = "";
    let a = compra.length;
    let idProd = 0;

    for (let u = 0; u < compra.length; u++) {
      id += `${compra[u].id}${u + 1 !== a ? "," : ""}`;
      qnt += `${compra[u].quantidade}${u + 1 !== a ? "," : ""}`;
    }

    let bool = true;

    //erro nas quantidades, ta subtraindo apenas um
    for (let i = 0; i < produtos.length; i++) {
      for (let u = 0; u < compra.length; u++) {
        if (compra[u].id === produtos[i].id) {
          total = produtos[i].quantidade - compra[u].quantidade;
          idProd = compra[u].id;
          if (total < 0) {
            alert("Estoque não possui a quantidade desejada");
            bool = false;
          } else {
            fetch(
              `http://localhost:4000/update?table=produtos&alt=quantidade="${total}"&id="${idProd}"`
            )
              .then(this.props.changeQnt(0))
              .then(cookie.remove("compra", { path: "/" }))
              .then(cookie.remove("carrinho", { path: "/" }))
              .catch(err => console.error(err));
          }
        }
      }
    }
    if (bool) {
      fetch(
        `http://localhost:4000/add?table=compras&campos=preco,idCliente,idProdutos,qntProdutos,data,estado&valores='${TotaldaCompra}','${id_cliente}','${id}','${qnt}','${data}','Pedido Pendente'`
      )
        .then(
          this.setState({
            entrega: {
              ...entrega,
              cpf: "",
              rua: "",
              casa: "",
              bairro: "",
              cidade: "",
              uf: ""
            }
          })
        )
        .catch(err => console.error(err));
    }
  };

  ModalFinalizacao = () => {
    return (
      <div className="static-modal">
        <Modal show={this.state.showF} onHide={this.handleCloseF}>
          <Modal.Header className="center">
            <Modal.Title>Finalizar</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {this.state.pedido && (
              <div>
                <i className="fas fa-check-circle" style={{ color: "#cf3" }} />
                <label style={{ color: "#cf3" }}>Compra Bem Sucedida!!</label>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              bsStyle="danger"
              onClick={() => this.props.handleChangePage("")}
            >
              <i className="fas fa-times" />
              Pagina Inicial
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  };
  Boleto = () => {
    let { entrega } = this.state;
    let valor = document.getElementById("total").value;
    let desconto = (valor * 10) / 100;
    let total = valor - desconto;
    fetch(
      `http://localhost:4000/boleto?total=${total.toFixed(
        2
      )}&desc=${desconto}&nome=${entrega.nome}&cpf=${entrega.cpf}&rua=${
        entrega.rua
      }&casa=${entrega.casa}&bairro=${entrega.bairro}&cidade=${
        entrega.cidade
      }&uf=${entrega.uf}&cep=${entrega.cep}`
    )
      .then(
        this.setState(
          {
            entrega: {
              ...entrega,
              cpf: "",
              rua: "",
              casa: "",
              bairro: "",
              cidade: "",
              uf: ""
            }
          },
          () => this.setState({ pedido: true, showB: false, showF: true })
        )
      )
      .then(this.EnviarBoleto())
      .catch(err => console.error(err));
  };
  DadosEntrega = () => {
    const { entrega, cliente } = this.state;
    console.log(cliente);
    return (
      <div className="car col-md-12 col-sm-12 col-xs-12">
        <div className="col-md-12 col-sm-12 col-xs-12">
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>Nome:</label>
            <input
              type="text"
              className="form-control"
              value={cliente[0].nome}
              disabled
            />
          </div>
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>CPF:</label>
            <MaskedInput
              onBlur={() =>
                entrega.cpf.length < 14 &&
                this.setState({ entrega: { ...entrega, cpf: "" } })
              }
              value={entrega.cpf}
              guide={false}
              mask={[
                /\d/,
                /\d/,
                /\d/,
                ".",
                /\d/,
                /\d/,
                /\d/,
                ".",
                /\d/,
                /\d/,
                /\d/,
                "-",
                /\d/,
                /\d/
              ]}
              className="form-control"
              onChange={e =>
                this.setState({ entrega: { ...entrega, cpf: e.target.value } })
              }
            />
          </div>
        </div>
        <div className="col-md-12 col-sm-12 col-xs-12">
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>Rua:</label>
            <input
              type="text"
              className="form-control"
              value={entrega.rua}
              onChange={e =>
                this.setState({ entrega: { ...entrega, rua: e.target.value } })
              }
            />
          </div>
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>Numero da Casa:</label>
            <input
              type="number"
              className="form-control"
              value={entrega.casa}
              onChange={e =>
                this.setState({ entrega: { ...entrega, casa: e.target.value } })
              }
            />
          </div>
        </div>
        <div className="col-md-12 col-sm-12 col-xs-12">
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>Bairro:</label>
            <input
              type="text"
              className="form-control"
              value={entrega.bairro}
              onChange={e =>
                this.setState({
                  entrega: { ...entrega, bairro: e.target.value }
                })
              }
            />
          </div>
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>Cidade:</label>
            <input
              type="text"
              className="form-control"
              value={entrega.cidade}
              onChange={e =>
                this.setState({
                  entrega: { ...entrega, cidade: e.target.value }
                })
              }
            />
          </div>
        </div>
        <div className="col-md-12 col-sm-12 col-xs-12">
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>UF:</label>
            <MaskedInput
              onBlur={() =>
                entrega.uf.length < 2 &&
                this.setState({ entrega: { ...entrega, uf: "" } })
              }
              value={entrega.uf}
              guide={false}
              mask={[/\w/, /\w/]}
              className="form-control"
              onChange={e =>
                this.setState({ entrega: { ...entrega, uf: e.target.value } })
              }
            />
          </div>
          <div className="col-md-6 col-sm-6 col-xs-12">
            <label>CEP:</label>
            <MaskedInput
              type="text"
              value={entrega.cep}
              guide={false}
              mask={[/\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/]}
              className="form-control"
              onChange={e =>
                this.setState({ entrega: { ...entrega, cep: e.target.value } })
              }
            />
          </div>
        </div>
      </div>
    );
  };
  Cartao = _ => {
    const { card } = this.state;
    return (
      <div>
        <button
          onClick={() => this.setState({ showC: true })}
          className="op btn btn-primary form-control"
        >
          <i className="fas fa-credit-card" /> <label>Cartão de Credito</label>
        </button>
        <div className="static-modal">
          <Modal show={this.state.showC} onHide={this.handleCloseC}>
            <Modal.Header className="center">
              <Modal.Title>Dados Entrega</Modal.Title>
            </Modal.Header>

            <Modal.Body className="ModalCartao">
              {this.DadosEntrega()}

              <div
                className="col-md-12 col-sm-12 col-xs-12 center"
                style={{ marginTop: "20px", marginBottom: "20px" }}
              >
                <Modal.Title>Cartao</Modal.Title>
              </div>

              <div className="car col-md-12 col-sm-12 col-xs-12">
                <div className="col-md-12 col-sm-12 col-xs-12">
                  <div className="col-md-6 col-sm-6 col-xs-12">
                    <label>Nome (Escrito no Cartao):</label>
                    <FormControl
                      type="text"
                      onChange={e =>
                        this.setState({
                          card: { ...card, name: e.target.value }
                        })
                      }
                      name="name"
                      onFocus={e =>
                        this.setState({
                          card: { ...card, focused: e.target.name }
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 col-sm-6 col-xs-12">
                    <label>Numero do Cartao:</label>
                    <MaskedInput
                      onBlur={() =>
                        card.number.length < 19 &&
                        this.setState({ card: { ...card, number: "" } })
                      }
                      value={this.state.card.number}
                      guide={false}
                      mask={[
                        /\d/,
                        /\d/,
                        /\d/,
                        /\d/,
                        " ",
                        /\d/,
                        /\d/,
                        /\d/,
                        /\d/,
                        " ",
                        /\d/,
                        /\d/,
                        /\d/,
                        /\d/,
                        " ",
                        /\d/,
                        /\d/,
                        /\d/,
                        /\d/
                      ]}
                      name="number"
                      onFocus={e =>
                        this.setState({
                          card: { ...card, focused: e.target.name }
                        })
                      }
                      onChange={e =>
                        this.setState({
                          card: { ...card, number: e.target.value }
                        })
                      }
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-md-12 col-sm-12 col-xs-12">
                  <div className="col-md-6 col-sm-6 col-xs-12">
                    <label>Validade:</label>
                    <MaskedInput
                      guide={false}
                      onBlur={() =>
                        card.expiry.length < 4 &&
                        this.setState({ card: { ...card, expiry: "" } })
                      }
                      value={this.state.card.expiry}
                      mask={[/\d/, /\d/, "/", /\d/, /\d/]}
                      className="form-control"
                      name="expiry"
                      onChange={e =>
                        this.setState({
                          card: { ...card, expiry: e.target.value }
                        })
                      }
                      onFocus={e =>
                        this.setState({
                          card: { ...card, focused: e.target.name }
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 col-sm-6 col-xs-12">
                    <label>CVC:</label>
                    <MaskedInput
                      guide={false}
                      mask={[/\d/, /\d/, /\d/]}
                      className="form-control"
                      onBlur={() =>
                        card.cvc.length < 16 &&
                        this.setState({ card: { ...card, cvc: "" } })
                      }
                      value={this.state.card.cvc}
                      name="cvc"
                      onFocus={e =>
                        this.setState({
                          card: { ...card, focused: e.target.name }
                        })
                      }
                      onChange={e =>
                        this.setState({
                          card: { ...card, cvc: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12 col-sm-12 col-xs-12">
                  <div className="col-md-12 col-sm-12 col-xs-12">
                    <label>Parcelas:</label>
                    <select className="form-control">{this.Parcelas()}</select>
                  </div>
                </div>
                <div className="col-md-12 col-sm-12 col-xs-12">
                  <br />
                  <Cards
                    className="ExampleCartao"
                    number={this.state.card.number}
                    name={this.state.card.name}
                    expiry={this.state.card.expiry}
                    cvc={this.state.card.cvc}
                    focused={this.state.card.focused}
                  />
                  <br />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.Enviar} bsStyle="primary">
                <i className="fab fa-telegram-plane" /> Enviar
              </Button>
              <Button bsStyle="danger" onClick={this.handleCloseC}>
                <i className="fas fa-times" /> Cancelar
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  };
  DadosBoleto = () => {
    return (
      <div>
        <button
          onClick={() => this.setState({ showB: true })}
          className="op btn btn-primary form-control"
        >
          <i className="fas fa-barcode" /> <label>Boleto</label>
        </button>
        <div className="static-modal">
          <Modal show={this.state.showB} onHide={this.handleCloseB}>
            <Modal.Header className="center">
              <Modal.Title>Dados Entrega</Modal.Title>
            </Modal.Header>

            <Modal.Body className="ModalBoletoEntrega">
              {this.DadosEntrega()}
            </Modal.Body>

            <Modal.Footer>
              <Button onClick={this.Boleto} bsStyle="primary">
                <i className="fab fa-telegram-plane" /> Enviar
              </Button>
              <Button bsStyle="danger" onClick={this.handleCloseB}>
                <i className="fas fa-times" /> Cancelar
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  };
  Dados = ({ id, nome, endereco, cep, telefone, email }) => {
    return (
      <div key={id}>
        <div className="in col-md-12 col-sm-12 col-xs-12">
          <div className="col-md-6 col-sm-6 col-xs-6">
            <h3 className="TituloDados">Dados Pessoais</h3>
            <label className="Dados">Nome: </label>
            <span className="InfoDados"> {nome}</span>
            <br />
            <label className="Dados">Telefone: </label>
            <span className="InfoDados"> {telefone}</span>
            <br />
            <label className="Dados">Email: </label>
            <span className="InfoDados"> {email}</span>
            <br />
          </div>
          <div className="col-md-6 col-sm-6 col-xs-6">
            <h3 className="TituloDados">Endereço de Entrega</h3>
            <label className="Dados">Endereço: </label>
            <span className="InfoDados"> {endereco}</span>
            <br />
            <label className="Dados">CEP: </label>
            <span className="InfoDados"> {cep}</span>
            <br />
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { compra } = this.state;
    return (
      <div className="tudo">
        {this.state.cliente.map(this.Dados)}
        <table
          style={{ border: "1px solid black" }}
          className="table table-striped tableFinish"
        >
          <thead>
            <tr className="headprod">
              <th colSpan="2">
                <h5>Produto</h5>
              </th>
              <th className="center">
                <h5>Quant.</h5>
              </th>
              <th className="center">
                <h5>Valor Uni.</h5>
              </th>
              <th className="center">
                <h5>Total</h5>
              </th>
            </tr>
          </thead>
          <tbody>
            {cookie.load("compra") &&
              compra.map((compra, i) => {
                return this.renderCompra(compra, i);
              })}
          </tbody>
        </table>
        <div className="total">
          <div className="Valor" />
          <div className="Valor">
            <input id="total" type="hidden" value={this.Total()} />
            <h4 className="ValorFinish">
              Total:
              <span>
                {" "}
                {cookie.load("compra") ? `R$` + this.Total() : "R$ 0.00"}
              </span>
            </h4>
          </div>
        </div>
        <div className="Forma">
          <div className="FormaPagamento">{this.Cartao()}</div>
          <div className="FormaPagamento">{this.DadosBoleto()}</div>
        </div>
        {this.ModalFinalizacao()}
      </div>
    );
  }
}
