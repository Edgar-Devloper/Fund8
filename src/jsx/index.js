import React, { useContext, lazy, Suspense } from "react";

/// React router dom
import {  Routes, Route, Outlet  } from "react-router-dom";

/// Context
import { ThemeContext } from "../context/ThemeContext";

/// Css
import "./index.css";
import "./chart.css";
import "./step.css";

/// Layout - Cargar siempre (necesarios para la estructura)
import Nav from "./layouts/nav";
import Footer from "./layouts/Footer";
import ScrollToTop from './pages/ScrollToTop';
import NFTSelectionModal from "./components/NFTSelectionModal";
import Setting from "./layouts/Setting";

/// Dashboard - Cargar solo los esenciales, el resto lazy
import Home from "./components/Dashboard/Home";
import TradingPage from './pages/Trading'; // Página principal
import MarketPage from './pages/Market';
import OrdersPage from './pages/Orders';
import OrderHistoryPage from './pages/OrderHistory';
import PortfolioPage from './pages/Portfolio';

// Lazy load de componentes pesados que no se usan en la página inicial
const CoinDetails = lazy(() => import("./components/Dashboard/CoinDetails"));
const MyWallet = lazy(() => import("./components/Dashboard/MyWallet"));
const Transactions = lazy(() => import("./components/Dashboard/Transactions"));
const Portofolio = lazy(() => import("./components/Dashboard/Portofolio"));
const MarketCapital = lazy(() => import("./components/Dashboard/MarketCapital"));
const Task = lazy(() => import("./components/Dashboard/Task"));

/// App - Lazy load (no se usan en página inicial)
const AppProfile = lazy(() => import("./components/AppsMenu/AppProfile/AppProfile"));
const Compose = lazy(() => import("./components/AppsMenu/Email/Compose/Compose"));
const Inbox = lazy(() => import("./components/AppsMenu/Email/Inbox/Inbox"));
const Read = lazy(() => import("./components/AppsMenu/Email/Read/Read"));
const Calendar = lazy(() => import("./components/AppsMenu/Calendar/Calendar"));
const PostDetails = lazy(() => import("./components/AppsMenu/AppProfile/PostDetails"));

/// Product List - Lazy load
const ProductGrid = lazy(() => import("./components/AppsMenu/Shop/ProductGrid/ProductGrid"));
const ProductList = lazy(() => import("./components/AppsMenu/Shop/ProductList/ProductList"));
const ProductDetail = lazy(() => import("./components/AppsMenu/Shop/ProductGrid/ProductDetail"));
const Checkout = lazy(() => import("./components/AppsMenu/Shop/Checkout/Checkout"));
const Invoice = lazy(() => import("./components/AppsMenu/Shop/Invoice/Invoice"));
const ProductOrder = lazy(() => import("./components/AppsMenu/Shop/ProductOrder"));
const Customers = lazy(() => import("./components/AppsMenu/Shop/Customers/Customers"));

/// Charts - Lazy load (muy pesados)
const SparklineChart = lazy(() => import("./components/charts/Sparkline"));
const ChartJs = lazy(() => import("./components/charts/Chartjs"));
const RechartJs = lazy(() => import("./components/charts/rechart"));
const ApexChart = lazy(() => import("./components/charts/apexcharts"));

/// Bootstrap - Lazy load (no se usan en página inicial)
const UiAlert = lazy(() => import("./components/bootstrap/Alert"));
const UiAccordion = lazy(() => import("./components/bootstrap/Accordion"));
const UiBadge = lazy(() => import("./components/bootstrap/Badge"));
const UiButton = lazy(() => import("./components/bootstrap/Button"));
const UiModal = lazy(() => import("./components/bootstrap/Modal"));
const UiButtonGroup = lazy(() => import("./components/bootstrap/ButtonGroup"));
const UiListGroup = lazy(() => import("./components/bootstrap/ListGroup"));
const UiCards = lazy(() => import("./components/bootstrap/Cards"));
const UiCarousel = lazy(() => import("./components/bootstrap/Carousel"));
const UiDropDown = lazy(() => import("./components/bootstrap/DropDown"));
const UiPopOver = lazy(() => import("./components/bootstrap/PopOver"));
const UiProgressBar = lazy(() => import("./components/bootstrap/ProgressBar"));
const UiTab = lazy(() => import("./components/bootstrap/Tab"));
const UiPagination = lazy(() => import("./components/bootstrap/Pagination"));
const UiGrid = lazy(() => import("./components/bootstrap/Grid"));
const UiTypography = lazy(() => import("./components/bootstrap/Typography"));

/// Plugins - Lazy load (muy pesados)
const Select2 = lazy(() => import("./components/PluginsMenu/Select2/Select2"));
const MainNouiSlider = lazy(() => import("./components/PluginsMenu/NouiSlider/MainNouiSlider"));
const MainSweetAlert = lazy(() => import("./components/PluginsMenu/SweetAlert/SweetAlert"));
const Toastr = lazy(() => import("./components/PluginsMenu/Toastr/Toastr"));
const JqvMap = lazy(() => import("./components/PluginsMenu/JqvMap/JqvMap"));
const Lightgallery = lazy(() => import("./components/PluginsMenu/Lightgallery/Lightgallery"));

//Redux
const Todo = lazy(() => import("./pages/Todo"));

/// Widget
const Widget = lazy(() => import("./pages/Widget"));

/// Table - Lazy load
const SortingTable = lazy(() => import("./components/table/SortingTable/SortingTable"));
const FilteringTable = lazy(() => import("./components/table/FilteringTable/FilteringTable"));
const DataTable = lazy(() => import("./components/table/DataTable"));
const BootstrapTable = lazy(() => import("./components/table/BootstrapTable"));

/// Form - Lazy load (CKEditor es muy pesado)
const Element = lazy(() => import("./components/Forms/Element/Element"));
const Wizard = lazy(() => import("./components/Forms/Wizard/Wizard"));
const CkEditor = lazy(() => import("./components/Forms/CkEditor/CkEditor"));
const Pickers = lazy(() => import("./components/Forms/Pickers/Pickers"));
const FormValidation = lazy(() => import("./components/Forms/FormValidation/FormValidation"));

/// Pages - Lazy load
const Registration = lazy(() => import("./pages/Registration"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const LockScreen = lazy(() => import("./pages/LockScreen"));
const Error400 = lazy(() => import("./pages/Error400"));
const Error403 = lazy(() => import("./pages/Error403"));
const Error404 = lazy(() => import("./pages/Error404"));
const Error500 = lazy(() => import("./pages/Error500"));
const Error503 = lazy(() => import("./pages/Error503"));

// Componente de carga para Suspense
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px' 
  }}>
    <div>Cargando...</div>
  </div>
);

// Wrapper para componentes lazy
const LazyWrapper = ({ Component }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

const Markup = () => {
  const allroutes = [
    /// Trading como página principal
    { url: "", component: TradingPage },
    { url: "trading", component: TradingPage },
    { url: 'market', component: MarketPage },
    { url: 'orders', component: OrdersPage },
    { url: 'order-history', component: OrderHistoryPage },
    { url: 'portfolio', component: PortfolioPage },
    /// Dashboard
    { url: "dashboard", component: Home },
    { url: "coin-details", component: CoinDetails, lazy: true },
    { url: "my-wallet", component: MyWallet, lazy: true },
    { url: "transactions", component: Transactions, lazy: true },
    { url: "portofolio", component: Portofolio, lazy: true },
    { url: "market-capital", component: MarketCapital, lazy: true },
    { url: "task", component: Task, lazy: true },

    /// Apps
    { url: "app-profile", component: AppProfile, lazy: true },
    { url: "email-compose", component: Compose, lazy: true },
    { url: "email-inbox", component: Inbox, lazy: true },
    { url: "email-read", component: Read, lazy: true },
    { url: "app-calender", component: Calendar, lazy: true },
    { url: "post-details", component: PostDetails, lazy: true },

    /// Chart
    { url: "chart-sparkline", component: SparklineChart, lazy: true },
    { url: "chart-chartjs", component: ChartJs, lazy: true },
    { url: "chart-apexchart", component: ApexChart, lazy: true },
    { url: "chart-rechart", component: RechartJs, lazy: true },

    /// Bootstrap
    { url: "ui-alert", component: UiAlert, lazy: true },
    { url: "ui-badge", component: UiBadge, lazy: true },
    { url: "ui-button", component: UiButton, lazy: true },
    { url: "ui-modal", component: UiModal, lazy: true },
    { url: "ui-button-group", component: UiButtonGroup, lazy: true },
    { url: "ui-accordion", component: UiAccordion, lazy: true },
    { url: "ui-list-group", component: UiListGroup, lazy: true },
    { url: "ui-card", component: UiCards, lazy: true },
    { url: "ui-carousel", component: UiCarousel, lazy: true },
    { url: "ui-dropdown", component: UiDropDown, lazy: true },
    { url: "ui-popover", component: UiPopOver, lazy: true },
    { url: "ui-progressbar", component: UiProgressBar, lazy: true },
    { url: "ui-tab", component: UiTab, lazy: true },
    { url: "ui-pagination", component: UiPagination, lazy: true },
    { url: "ui-typography", component: UiTypography, lazy: true },
    { url: "ui-grid", component: UiGrid, lazy: true },

    /// Plugin
    { url: "uc-select2", component: Select2, lazy: true },
    { url: "uc-noui-slider", component: MainNouiSlider, lazy: true },
    { url: "uc-sweetalert", component: MainSweetAlert, lazy: true },
    { url: "uc-toastr", component: Toastr, lazy: true },
    { url: "map-jqvmap", component: JqvMap, lazy: true },
    { url: "uc-lightgallery", component: Lightgallery, lazy: true },

	///Redux
	{ url: "todo", component: Todo, lazy: true },
	
    /// Widget
    { url: "widget-basic", component: Widget, lazy: true },

    /// Shop
    { url: "ecom-product-grid", component: ProductGrid, lazy: true },
    { url: "ecom-product-list", component: ProductList, lazy: true },
    { url: "ecom-product-detail", component: ProductDetail, lazy: true },
    { url: "ecom-product-order", component: ProductOrder, lazy: true },
    { url: "ecom-checkout", component: Checkout, lazy: true },
    { url: "ecom-invoice", component: Invoice, lazy: true },
    { url: "ecom-customers", component: Customers, lazy: true },

    /// Form
    { url: "form-element", component: Element, lazy: true },
    { url: "form-wizard", component: Wizard, lazy: true },
    { url: "form-ckeditor", component: CkEditor, lazy: true },
    { url: "form-pickers", component: Pickers, lazy: true },
    { url: "form-validation", component: FormValidation, lazy: true },

    /// table
	{ url: 'table-filtering', component: FilteringTable, lazy: true },
    { url: 'table-sorting', component: SortingTable, lazy: true },
    { url: "table-datatable-basic", component: DataTable, lazy: true },
    { url: "table-bootstrap-basic", component: BootstrapTable, lazy: true },

    /// pages
    { url: "page-register", component: Registration, lazy: true },
    { url: "page-lock-screen", component: LockScreen, lazy: true },
    { url: "page-login", component: Login, lazy: true },
    { url: "page-forgot-password", component: ForgotPassword, lazy: true },
    { url: "page-error-400", component: Error400, lazy: true },
    { url: "page-error-403", component: Error403, lazy: true },
    { url: "page-error-404", component: Error404, lazy: true },
    { url: "page-error-500", component: Error500, lazy: true },
    { url: "page-error-503", component: Error503, lazy: true },
  ];

  return (
    <>
      <Routes>
          <Route path='/page-lock-screen' element={<LazyWrapper Component={LockScreen} />} />
          <Route path='/page-error-400' element={<LazyWrapper Component={Error400} />} />
          <Route path='/page-error-403' element={<LazyWrapper Component={Error403} />} />
          <Route path='/page-error-404' element={<LazyWrapper Component={Error404} />} />
          <Route path='/page-error-500' element={<LazyWrapper Component={Error500} />} />
          <Route path='/page-error-503' element={<LazyWrapper Component={Error503} />} />
          <Route element={<MainLayout />} > 
              {allroutes.map((data, i) => (
                <Route
                  key={i}
                  path={data.url === "" ? "/" : `/${data.url}`}
                  element={data.lazy ? <LazyWrapper Component={data.component} /> : <data.component />}
                />
              ))}
          </Route>
      </Routes>
      <Setting />
	  <ScrollToTop />
      <NFTSelectionModal />
    </>
  );
};

function MainLayout(){
  const { menuToggle, sidebariconHover } = useContext(ThemeContext);
  return (
    <div id="main-wrapper" className={`trading-fullscreen-layout show ${sidebariconHover ? "iconhover-toggle": ""} ${ menuToggle ? "menu-toggle" : ""}`}>  
      <Nav />
      <div className="content-body" style={{ minHeight: window.screen.height - 45, marginLeft: 0, padding: 0 }}>
          <div className="container-fluid" style={{ padding: 0, maxWidth: '100%' }}>
            <Outlet />                
          </div>
      </div>
      <Footer />
    </div>
  )
};

export default Markup;
