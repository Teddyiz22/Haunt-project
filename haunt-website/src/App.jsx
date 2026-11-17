import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Account from './pages/Account.jsx'
import About from './pages/About.jsx'
import Collection from './pages/Collection.jsx'
import ContactPage from './pages/ContactPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:slug" element={<ProductDetails />} />
      <Route path="/bag" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/account" element={<Account />} />
      <Route path="/about" element={<About />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/contact" element={<ContactPage />} />
    </Routes>
  )
}
