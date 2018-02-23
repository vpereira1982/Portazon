import React from 'react';
import ReactDOM from 'react-dom';
import { Redirect, Route, withRouter, Switch} from 'react-router-dom';

import Header from './header.jsx';
import Footer from './footer.jsx';
import HomePage from './homePage.jsx';
import ShoppingCart from './shoppingCart.jsx';
import ProductsList from './productsListPage.jsx';
import ProductCard from './productCard.jsx';
import ProductDetail from './productDetailPage.jsx';
import CheckOut from './checkOut.jsx';
import RegisterUserForm from './registerUserForm.jsx';
import RegisterSuccess from './registerSuccess.jsx';

const axios = require('axios');

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 'homePage',
      cart: null,
      totalAmt: '',
      searchedItems: null,
      query: '',
      productDetail: '',
      userInvoice:'',
      user: {firstname: 'Guest'},
      featuredProducts: []
    }
    this.changeView = this.changeView.bind(this);
    this.submitQuery = this.submitQuery.bind(this);
    this.addItemToCart = this.addItemToCart.bind(this);
    this.registerUser = this.registerUser.bind(this);
    this.login = this.login.bind(this);
    this.getFeaturedProducts = this.getFeaturedProducts.bind(this);
    this.getCartByUser = this.getCartByUser.bind(this);
    this.logout = this.logout.bind(this);
    this.removeItemFromCart = this.removeItemFromCart.bind(this);
  }

  getFeaturedProducts() {
    axios.get('search?q=rating%205')
      .then(items => {
        let noDupes = cutDuplicates(items.data);
        let filteredImages = filterDuplicateImages(noDupes);
        this.setState({featuredProducts: filteredImages, view: 'homePage'});
      })
      .catch(err => console.log('error fetching five rated products'));
  }

  componentWillMount(){
    this.getFeaturedProducts();
  }

  changeView(view, item, invoice){
    this.setState({view: view, productDetail: item, userInvoice: invoice});

    let history = this.props.history;

    if(view === 'productDetail'){
      history.push('/product_detail');
    } else if (view === 'shoppingCart') {
      history.push('/shoppingcart');
    } else if (view === 'checkOut') {
      history.push('/checkout');
    } else if (view === 'registerUserForm') {
      history.push('/register_user');
    }
  }

  login(user) {
    axios.post('users/login', user)
      .then(user => {
        this.setState({user: user.data, view: 'homePage'});
        this.props.history.push('/');
        this.getCartByUser();

      })
      .catch(err => alert('Oops! Incorrect Email and/or password combination'));
  }

  logout() {
    let user = this.state.user;
    axios.get('users/logout', user)
      .then(response => {
        alert('Successfully logged out!')
        this.setState({user: {firstname: 'Guest'}})
      })
      .catch(err => console.log('err logging out', err))
  }

  registerUser(user) {
    axios.post('users/registerUser', user)
      .then(response => {
        this.props.history.push('/register_success');
      })
      .catch(err => console.log('err', err))
  }

  submitQuery(query) {
    axios.get('search/?q=' + query)
      .then(res => {
        let items = res.data;
        let noDupes = cutDuplicates(items);
        let parseImages = parseImageUrls(noDupes);

        if (this.state.view !== 'productsList') {
          this.setState({searchedItems: parseImages, query: query, view: 'productsList'})
        } else {
          this.setState({searchedItems: parseImages, query: query});
        }
        this.props.history.push('/products');
      })
    }

  getCartByUser() {
    let curUser = {
      userID: this.state.user.id,
      firstname: this.state.user.firstname,
      lastname: this.state.user.lastname,
      email: this.state.user.email
    };

    axios.post('users/cart', curUser)
      .then(response => {
        this.setState({cart: JSON.parse(response.data[0].cart)});
      })
      .catch(err => console.log('err getting cart', err))
  }

  addItemToCart(item) {
    // console.log('in addItemToCart', item, this.state.user)
    var obj;
    var price;
    if (!item._source.discounted_price) {
      price = item._source.retail_price
    } else {
      price = item._source.discounted_price;
    }
    if (this.state.user.id) {
      obj = {
        userID: this.state.user.id,
        productID: item._id,
        productName: item._source.product_name,
        amount: item.quantity,
        price: price,
        image_url: item._source.image[0],
        email: this.state.user.email,
        deleteItem: false
      }
    }
    axios.post('users/updateCart', obj)
      .then(response => {
        console.log('response when update cart', response);
        this.getCartByUser();
        alert('This item was added to your cart!');
      })
      .catch(err => console.log(err))

    // let cart = this.state.cart;
    // if (!cart) {
    //   this.setState({cart: [item]})
    // } else {
    //   let update = cart.push(item);
    //   this.setState({cart: cart});
    // }
  }

  removeItemFromCart(item) {
    console.log('in removeItemFromCart!')
    if (this.state.user) {
      let obj = {
        userID: this.state.user.id,
        productID: item._id,
        amount: item.quantity,
        email: this.state.user.email,
        deleteItem: true
      }
    }
    // let cart = this.state.cart;
    // for (let i = 0; i < cart.length; i++) {
    //   if (cart[i] === item) {
    //     cart.splice(i, 1);
    //     return;
    //   }
    // }
    // return;
  }

  render() {

    return (
      <div>
        <Header changeView={this.changeView} submitQuery={this.submitQuery} login={this.login} user={this.state.user} logout={this.logout}/>
        <Switch>
          <Route exact path='/'
            render={()=><HomePage user={this.state.user} changeView={this.changeView} submitQuery={this.submitQuery} featuredProducts={this.state.featuredProducts}/>}>
          </Route>
          <Route exact path='/products'
            render={()=><ProductsList products={this.state.searchedItems} query={this.state.query} addItemToCart={this.addItemToCart} submitQuery={this.submitQuery} changeView={this.changeView}/>  }>
          </Route>
          <Route exact path='/product_detail'
            render={()=><ProductDetail item={this.state.productDetail}
            addItemToCart={this.addItemToCart}/>  }>
          </Route>
          <Route exact path='/shoppingcart'
            render={()=><ShoppingCart cart={this.state.cart} changeView={this.changeView} getCart={this.getCartByUser} removeItemFromCart={this.removeItemFromCart}/>  }>
          </Route>
          <Route exact path='/checkout'
            render={()=><CheckOut/>  }>
          </Route>
          <Route exact path='/register_user'
            render={()=><RegisterUserForm registerUser={this.registerUser}/>  }>
          </Route>
          <Route exact path='/register_success'
            render={() =><RegisterSuccess /> }>
          </Route>
          <Route path='*' component={HomePage}></Route>
        </Switch>

      </div>
    );
  }
}



function parseImageUrls(items) {
  for (let i = 0; i < items.length; i++) {
    let images = JSON.parse(items[i]._source.image);
    items[i]._source.image = images;
    if (items[i]._source.discounted_price === null || !items[i]._source.retail_price === null) {
      items.splice(i, 1);
    }
  }
  return items;
}

function cutDuplicates(items) {
  let list = [];
  let newItemList = [];

  for (let i = 0; i < items.length; i++) {
    if (!list.includes(items[i]._source.product_name)) {
      list.push(items[i]._source.product_name);
      newItemList.push(items[i])
    }
  }
  return newItemList;
}

function filterDuplicateImages(items){
  let list = [];
  let noDupesList = [];
  for(let i = 0; i < items.length; i++) {
    let images = JSON.parse(items[i]._source.image);
    if(list.indexOf(images[0]) == -1){
      list.push(images[0]);
      noDupesList.push(items[i]);
    }
  }
  return noDupesList;
}

export default withRouter(App);



