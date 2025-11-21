import React,{Fragment,useContext, useState} from 'react';
import {Link} from 'react-router-dom';
import { Dropdown } from "react-bootstrap";
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";

//Import
import { ThemeContext } from "../../../context/ThemeContext";
import { useWallet } from "../../../context/WalletContext.js";
import { useUserBalance } from "../../../hooks/useUserBalance.js";
import Donut from "../Boltz/MyWallet/Donut";
import WalletTab from "../Boltz/MyWallet/WalletTab";
import SwiperSlider2 from "../Boltz/MyWallet/SwiperSlider2";
import QuickTransfer from '../Boltz/Home/QuickTransfer';

const CoinChart = loadable(() =>
  pMinDelay(import("../Boltz/MyWallet/CoinChart"), 1000)
);

const MyWallet = () => {
	const { background } = useContext(ThemeContext);
	const [crrency1, setCrrency1] = useState("Monthly (2021)");
	
	// Obtener wallet conectado y datos del usuario
	const { address, isConnected } = useWallet();
	const { userState, loading: balanceLoading } = useUserBalance();
	
	// Extraer datos reales
	const accountValue = parseFloat(userState?.crossMarginSummary?.accountValue || 0);
	const totalMarginUsed = parseFloat(userState?.crossMarginSummary?.totalMarginUsed || 0);
	const withdrawable = parseFloat(userState?.withdrawable || 0);
	
	// Formatear dirección
	const formatAddress = (addr) => {
		if (!addr) return 'Not Connected';
		return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
	};
	
	// Formatear moneda
	const formatCurrency = (value) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(value);
	};
	
	return(
		<Fragment>
			<div className="form-head mb-sm-3 mb-3 d-flex align-items-center flex-wrap mt-3 text-head">
				<h2 className="font-w600 mb-0 me-auto mb-2">Wallets</h2>
				<Link to={"#"} className="btn btn-outline-primary me-3 mb-2 rounded"><i className="las la-calendar scale5 me-2"></i>Filter Periode</Link>
				<Link to={"#"} className="btn btn-primary me-3 mb-2 rounded"><i className="las la-calendar scale5 me-2"></i>Filter Periode</Link>
			</div>
			<div className="row">
				<div className="col-xl-3 col-xxl-4">
					<div className="swiper-box">
						<SwiperSlider2 
							accountValue={accountValue}
							walletAddress={address}
							loading={balanceLoading}
						/>
					</div>
				</div>
				<div className="col-xl-9 col-xxl-8">
					<div className="row">
						<div className="col-xl-12">
							<div className="d-block d-sm-flex mb-4">
								<h4 className="mb-0 text-black fs-24 me-auto">Card Details</h4>
								<div className="d-flex mt-sm-0">
									<Link to={"#"} className="btn-link me-3">Generate Number</Link>
									<Link to={"#"} className="btn-link text-light">Edit</Link>
								</div>
							</div>
						</div>	
						<div className="col-xl-12">
							<div className="card">
								<div className="card-body">
									<div className="row align-items-end">
										<div className="col-xl-6 col-lg-12 col-xxl-12">
											<div className="row">
												<div className="col-sm-6">
													<div className="mb-4">
														<p className="mb-2">Wallet Address</p>
														<h4 className="text-black">
															{balanceLoading ? 'Cargando...' : formatAddress(address)}
														</h4>
													</div>
													<div className="mb-4">
														<p className="mb-2">Account Value</p>
														<h4 className="text-black">
															{balanceLoading ? 'Cargando...' : formatCurrency(accountValue)}
														</h4>
													</div>
													<div>
														<p className="mb-2">Network</p>
														<h4 className="text-black">Arbitrum (Hyperliquid)</h4>
													</div>
												</div>
												<div className="col-sm-6">
													<div className="mb-4">
														<p className="mb-2">Total Margin Used</p>
														<h4 className="text-black">
															{balanceLoading ? 'Cargando...' : formatCurrency(totalMarginUsed)}
														</h4>
													</div>
													<div className="mb-4">
														<p className="mb-2">Withdrawable</p>
														<h4 className="text-black">
															{balanceLoading ? 'Cargando...' : formatCurrency(withdrawable)}
														</h4>
													</div>
													<div>
														<p className="mb-2">Card Theme</p>
														<div className="btn-group theme-colors" data-toggle="buttons">
															<input type="radio" className="btn-check position-absolute"  name="btnradio" id="btnradio1" checked />
															<label className="btn btn-info" htmlFor="btnradio1"><i className="las la-check-circle"></i></label>
															<input type="radio" className="btn-check" name="btnradio" id="btnradio2" />
															<label className="btn btn-warning" htmlFor="btnradio2"><i className="las la-check-circle"></i></label>
															<input type="radio" className="btn-check" name="btnradio" id="btnradio3" />
															<label className="btn btn-success" htmlFor="btnradio3"><i className="las la-check-circle"></i></label>
															<input type="radio" className="btn-check" name="btnradio" id="btnradio4" />
															<label className="btn btn-secondary" htmlFor="btnradio4"><i className="las la-check-circle"></i></label>
															<input type="radio" className="btn-check" name="btnradio" id="btnradio5" />
															<label className="btn btn-primary" htmlFor="btnradio5"><i className="las la-check-circle"></i></label>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="col-xl-6 col-lg-12 col-xxl-12 mb-lg-0 mb-3">
											<p>Monthly Limits</p>
											<div className="row">
												<div className="col-sm-4 mb-sm-0 mb-4 text-center">
													<div className="d-inline-block position-relative donut-chart-sale mb-3">
														{background.value === "dark" ? (
														  <Donut
															value={accountValue > 0 ? Math.min((totalMarginUsed / accountValue) * 100, 100) : 0}
															backgroundColor="#FF6826"
															backgroundColor2="#F0F0F0"
														  />
														) : (
														  <Donut 
															value={accountValue > 0 ? Math.min((totalMarginUsed / accountValue) * 100, 100) : 0}
															backgroundColor="#2258bf" 
															backgroundColor2="rgba(240, 240, 240,1)"
														  />
														)}
														<small>{accountValue > 0 ? Math.round((totalMarginUsed / accountValue) * 100) : 0}%</small>
													</div>
													<h5 className="fs-18 text-black">Margin Used</h5>
													<span>{formatCurrency(totalMarginUsed)}</span>
												</div>
												<div className="col-sm-4 mb-sm-0 mb-4 text-center">
													<div className="d-inline-block position-relative donut-chart-sale mb-3">
														{background.value === "dark" ? (
														  <Donut
															value={accountValue > 0 ? Math.min((withdrawable / accountValue) * 100, 100) : 0}
															backgroundColor="#1DC624"
															backgroundColor2="#F0F0F0"
														  />
														) : (
														  <Donut 
															value={accountValue > 0 ? Math.min((withdrawable / accountValue) * 100, 100) : 0}
															backgroundColor="#1DC624" 
															backgroundColor2="rgba(240, 240, 240,1)"
														  />
														)}
														<small>{accountValue > 0 ? Math.round((withdrawable / accountValue) * 100) : 0}%</small>
													</div>
													<h5 className="fs-18 text-black">Available</h5>
													<span>{formatCurrency(withdrawable)}</span>
												</div>
												<div className="col-sm-4 text-center">
													<div className="d-inline-block position-relative donut-chart-sale mb-3">
														{background.value === "dark" ? (
														  <Donut
															value={100}
															backgroundColor="#2258bf"
															backgroundColor2="#F0F0F0"
														  />
														) : (
														  <Donut 
															value={100}
															backgroundColor="#1DC624" 
															backgroundColor2="rgba(240, 240, 240,1)"
														  />
														)}
														<small>100%</small>
													</div>
													<h5 className="fs-18 text-black">Total Value</h5>
													<span>{formatCurrency(accountValue)}</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="col-xl-12">
							<div className="card">
								<div className="card-header d-block d-sm-flex border-0 pb-sm-0 pb-0 align-items-center">
									<div className="me-auto mb-sm-0 mb-3">
										<h4 className="fs-20 text-black">Overview Balance</h4>
										<p className=" fs-12">Lorem ipsum dolor sit amet, consectetur</p>
									</div>
									<Dropdown>
										<Dropdown.Toggle variant="" className="form-control style-1 default-select">{crrency1}</Dropdown.Toggle>
										<Dropdown.Menu>
											<Dropdown.Item onClick={() => setCrrency1("Monthly (2021)")}>Monthly (2021)</Dropdown.Item>
											<Dropdown.Item onClick={() => setCrrency1("Daily (2021)")}>Daily (2021)</Dropdown.Item>
											<Dropdown.Item onClick={() => setCrrency1("Weekly (2021)")}>Weekly (2021)</Dropdown.Item>
										 </Dropdown.Menu>
									</Dropdown>
								</div>
								<div className="card-body pt-3">
									<div className="flex-wrap mb-sm-4 mb-2 align-items-center">
										<div className="d-flex align-items-center">
											<span className="fs-32 text-black font-w600 pe-3">
												{balanceLoading ? 'Cargando...' : formatCurrency(accountValue)}
											</span>
											{!isConnected && (
												<span className="fs-14 text-warning ms-3">
													<i className="fa fa-exclamation-triangle me-2"></i>
													Conecta tu wallet para ver datos reales
												</span>
											)}
										</div>
										<p className="mb-0 text-black me-auto">
											Account Value <span className="text-success">(Datos en tiempo real de Hyperliquid)</span>
										</p>
									</div>
									<div id="chartTimeline" className="timeline-chart market-line">
										<CoinChart />	
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-6 col-xxl-12 mt-4">
					<div className="row">
						<div className="col-xl-12">
							<WalletTab  activeMenu ="Wallet Activity" />
						</div>
					</div>
				</div>
				<div className="col-xl-6 col-xxl-12 mt-4">
					<div className="row">
						<div className="col-xl-12">
							<QuickTransfer />
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	)
}		 
export default MyWallet;