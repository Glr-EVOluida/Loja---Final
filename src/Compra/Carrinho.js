import React, { Component } from "react";
import { Headline } from "../Produtos/Headline";
import cookie from "react-cookies";

export class Carrinho extends Component {
  state = {
    produtos: [],
    carrinho: [],
    empty: false
  };

  componentDidMount() {
    this.getProdutos();
    cookie.load("carrinho")
      ? this.getCarrinhoCookie()
      : this.setState({ empty: true });
  }
  getCarrinhoCookie = _ => {
    let value = cookie.load("carrinho");
    this.setState({ carrinho: value }, () => {
      this.props.changeQnt(value.length);
      if (this.state.carrinho.length < 1) {
        this.setState({ empty: true });
      }
    });
  };

  getProdutos = _ => {
    fetch(`http://localhost:4000/show?table=produtos`)
      .then(response => response.json())
      .then(response => this.setState({ produtos: response.data }))
      .catch(err => console.error(err));
  };

  handleChange = (id, e) => {
    const { carrinho } = this.state;

    let valor = 0;
    if (parseInt(e.target.value, 10) > 0) {
      valor = parseInt(e.target.value, 10);
    }

    if (!(valor < 0)) {
      const produtos = carrinho.map(prod => {
        if (prod.id === id) {
          return { id: id, quantidade: valor };
        } else {
          return prod;
        }
      });
      this.setState({ carrinho: produtos }, () => {
        const expires = new Date();
        expires.setDate(expires.getDate() + 14);

        cookie.save("carrinho", this.state.carrinho, { path: "/", expires });
        this.getCarrinhoCookie();
      });
    }
  };

  handleDeleteClick = id => {
    const { carrinho } = this.state;

    let produtos = [];

    for (let i = 0; i < carrinho.length; i++) {
      if (carrinho[i].id !== id) {
        produtos.push(carrinho[i]);
      }
    }

    this.setState({ carrinho: produtos }, () => {
      const expires = new Date();
      expires.setDate(expires.getDate() + 14);

      cookie.save("carrinho", this.state.carrinho, { path: "/", expires });

      this.getCarrinhoCookie();
    });
  };

  handleFinishBuy = _ => {
    const { carrinho } = this.state;

    const expires = new Date();
    expires.setDate(expires.getDate() + 14);

    cookie.save("compra", carrinho, { path: "/", expires });
    this.props.handleChangePage("finish");
  };

  Total = _ => {
    const { carrinho, produtos } = this.state;

    let total = 0;

    for (let i = 0; i < produtos.length; i++) {
      for (let u = 0; u < carrinho.length; u++) {
        if (carrinho[u].id === produtos[i].id) {
          total += produtos[i].preco * carrinho[u].quantidade;
        }
      }
    }

    return total.toFixed(2);
  };

  renderCarrinho = (carrinho, i) => {
    const { produtos } = this.state;

    let item;
    let bool = false;

    for (let i = 0; i < produtos.length; i++) {
      if (carrinho.id === produtos[i].id) {
        item = produtos[i];
        bool = true;
      }
    }
    if (bool) {
      return (
        <tr key={i}>
          <td width="70">
            <img
              className="ImgTabelaCarrinho"
              src={`http://localhost:3000/uploads/${item.img}`}
              style={{ borderRadius: "3px" }}
              alt={item.nome}
            />
          </td>
          <td className="TextoTabelaCarrinho">
            <div className="DivTextoTabelaCarrinho">
              <span>{item.nome}</span>
            </div>
          </td>
          <td>
            <a
              className="ButtonTabelaCarrinho btn-danger"
              onClick={() => this.handleDeleteClick(item.id)}
            >
              <b>X</b>
            </a>
          </td>
          <td>
            <input
              type="text"
              className="InputTabelaCarrinho form-control"
              value={carrinho.quantidade}
              onChange={e => this.handleChange(item.id, e)}
              maxLength="3"
            />
          </td>
          <td className="TextoTabelaCarrinho">
            <i>R$</i> <span>{item.preco.toFixed(2)}</span>
          </td>
          <td className="TextoTabelaCarrinho">
            <i>R$</i>{" "}
            <span>{(item.preco * carrinho.quantidade).toFixed(2)}</span>
          </td>
        </tr>
      );
    }
  };

  checkLogin = _ => {
    if (!cookie.load("usuario") && this.props.logar === false) {
      return true;
    } else {
      return false;
    }
  };

  render() {
    const { carrinho, empty } = this.state;

    const logado = this.checkLogin();

    return (
      <div className="col-md-12 col-sm-12 col-xs-12">
        <Headline headline={`Carrinho`} />
        <div>
          <table className="table tabela table-striped">
            <thead>
              <tr className="TextoTabelaCarrinho">
                <th colSpan="2">Produto</th>
                <th width="50" />
                <th width="100">Quantidade</th>
                <th width="150">Preço Unitário</th>
                <th width="150">Preço Total</th>
              </tr>
            </thead>
            <tbody>
              {!empty ? (
                carrinho.map((carrinho, i) => {
                  return this.renderCarrinho(carrinho, i);
                })
              ) : (
                <tr>
                  <td style={{ textAlign: "center" }} colSpan="6">
                    Não tem produtos no carrinho
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="Finalizar">
          <div className="ItemFinalizar" style={{ marginTop: "2%" }}>
            <span className="TotalCarrinho" style={{ color: "#005b88" }}>
              {" "}
              <b> Total:</b> <i>R$</i> {this.Total()}
            </span>
          </div>
          <div className="ItemFinalizar">
            {!empty &&
              (logado ? (
                <a
                  className="ButtonFinalizar btn btn-success"
                  onClick={() => this.props.handleChangePage("signup")}
                >
                  <i className="fas fa-money-bill-alt" />
                  Finalizar Compra
                </a>
              ) : (
                <a
                  className="ButtonFinalizar btn btn-success"
                  onClick={() => this.handleFinishBuy()}
                >
                  <i className="fas fa-money-bill-alt" />
                  Finalizar Compra
                </a>
              ))}
          </div>
        </div>
        <div className="Aviso">
          <span>
            {!empty
              ? logado && <b>Necessario login para poder finalizar a compra</b>
              : ""}
          </span>
        </div>
      </div>
    );
  }
}
