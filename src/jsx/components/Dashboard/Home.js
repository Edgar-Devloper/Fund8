import React,{useState,useContext, useEffect} from 'react';
import {Link} from 'react-router-dom';
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import {Dropdown} from 'react-bootstrap';

//Import
import { ThemeContext } from "../../../context/ThemeContext";
import CardSlider from '../Boltz/Home/CardSlider';
import PreviousTab from '../Boltz/Home/PreviousTab';
import OrderData from '../Boltz/Home/OrderData';
import QuickTrade from '../Boltz/Home/QuickTrade';
import QuickTransfer from '../Boltz/Home/QuickTransfer';

const CurrentRadialApex = loadable(() =>
	pMinDelay(import("../Boltz/Home/CurrentRadialApex"), 1000)
);
const MarketLineApex = loadable(() =>
	pMinDelay(import("../Boltz/Home/MarketLineApex"), 1000)
);

const Home = () => {
	const { changeBackground, background } = useContext(ThemeContext);
	  useEffect(() => {
		changeBackground({ value: "light", label: "Light" });
	}, []);
	const [country1, setCountry1] = useState("Medan, IDN");		
	const [duration2, setDuration2] = useState("Weekly (2021)");	
	
	return(
		<>
			<div className="mb-sm-4 d-flex flex-wrap align-items-center text-head">
				<h2 className="font-w600 mb-2 me-auto">Dashboard</h2>
				<Dropdown className=" weather-btn mb-2">
					<span className="fs-22 font-w600 d-flex"><i className="fa fa-cloud me-3 ms-3"></i>21</span>
					<Dropdown.Toggle variant="" as="div" className="form-control style-3 default-select cursor-pointer">{country1} </Dropdown.Toggle>
					<Dropdown.Menu >
						<Dropdown.Item onClick={() => setCountry1("Medan, IDN")}>Medan, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Jakarta, IDN")}>Jakarta, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Surabaya, IDN")}>Surabaya, IDN</Dropdown.Item>
					 </Dropdown.Menu>
				</Dropdown>
				<Link to={"#"} className="btn btn-primary mb-2 rounded"><i className="las la-calendar scale5 me-3"></i>Filter Periode</Link>
			</div>	
			<div className="row">
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="30" cy="30" r="30" fill="white"/>
									<path d="M30 0C13.4312 0 0 13.4312 0 30C0 46.5688 13.4312 60 30 60C46.5688 60 60 46.5688 60 30C60 13.4312 46.5688 0 30 0ZM30 54.375C16.5588 54.375 5.625 43.44 5.625 30C5.625 16.56 16.5588 5.625 30 5.625C43.4412 5.625 54.375 16.5588 54.375 30C54.375 43.4412 43.44 54.375 30 54.375Z" fill="#F7931A"/>
									<path d="M31.5488 30.9737H27.61V36.825H31.5488C32.3438 36.825 33.0813 36.5025 33.5988 35.9612C34.14 35.4425 34.4625 34.7062 34.4625 33.8875C34.4638 32.2862 33.15 30.9737 31.5488 30.9737Z" fill="#F7931A"/>
									<path d="M30 8.12496C17.9375 8.12496 8.125 17.9375 8.125 30C8.125 42.0625 17.9375 51.875 30 51.875C42.0625 51.875 51.875 42.0612 51.875 30C51.875 17.9387 42.0612 8.12496 30 8.12496ZM34.4512 40.13H31.8712V44.185H29.165V40.13H27.6787V44.185H24.96V40.13H20.18V37.585H22.8175V22.335H20.18V19.79H24.96V15.8162H27.6787V19.79H29.165V15.8162H31.8712V19.79H34.2212C35.5337 19.79 36.7437 20.3312 37.6075 21.195C38.4712 22.0587 39.0125 23.2687 39.0125 24.5812C39.0125 27.15 36.985 29.2462 34.4512 29.3612C37.4225 29.3612 39.8187 31.78 39.8187 34.7512C39.8187 37.7112 37.4237 40.13 34.4512 40.13Z" fill="#F7931A"/>
									<path d="M33.2888 27.38C33.7613 26.9075 34.0488 26.2737 34.0488 25.56C34.0488 24.1437 32.8975 22.9912 31.48 22.9912H27.61V28.14H31.48C32.1825 28.14 32.8275 27.84 33.2888 27.38Z" fill="#F7931A"/>
								</svg>
							</div>
							<div>
								<h2 className="invoice-num">$984</h2>
								<p className="mb-0 invoice-num1">
									<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" stroke="#13B440" strokeWidth="2" strokeLinecap="round"/>
									</svg>
									<span className="text-success me-1 ms-1">45%</span> This week
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
									<g opacity="0.99">
									<circle cx="30" cy="30.0001" r="30" fill="white"/>
									<path d="M30.5438 0.00514091C13.9681 -0.294871 0.305031 12.8932 0.00501883 29.4563C-0.294993 46.0195 12.893 59.6951 29.4562 59.9951C46.0194 60.2951 59.695 47.1071 59.995 30.5314C60.295 13.9682 47.1069 0.292653 30.5438 0.00514091ZM29.5562 54.3699C16.1182 54.1198 5.38024 42.9944 5.63025 29.5563C5.86776 16.1183 16.9932 5.38036 30.4313 5.61787C43.8818 5.86788 54.6072 16.9933 54.3697 30.4314C54.1322 43.8694 42.9943 54.6074 29.5562 54.3699Z" fill="#FF6600"/>
									<path d="M30.3938 8.11797C18.3308 7.90546 8.34286 17.5434 8.13035 29.6063C8.0591 33.4015 8.97038 36.9904 10.623 40.1355H17.4995V18.6021C17.4995 17.2858 19.2883 16.8671 19.8696 18.0484L30 38.563L40.1304 18.0496C40.7117 16.8671 42.5005 17.2858 42.5005 18.6021V40.1355H49.3558C50.8933 37.2129 51.8084 33.9128 51.8696 30.3939C52.0821 18.3309 42.4567 8.34298 30.3938 8.11797Z" fill="#FF6600"/>
									<path d="M40.0004 41.3856V23.9574L31.12 41.9393C30.7 42.7931 29.2987 42.7931 28.8787 41.9393L19.9996 23.9574V41.3856C19.9996 42.0756 19.4408 42.6356 18.7495 42.6356H12.1855C16.0744 48.0996 22.3972 51.7347 29.6062 51.8697C37.1028 52.0023 43.793 48.3271 47.8395 42.6356H41.2504C40.5592 42.6356 40.0004 42.0756 40.0004 41.3856Z" fill="#FF6600"/>
									</g>
								</svg>
							</div>
							<div>
								<h2 className="invoice-num">$22,567</h2>
								<p className="mb-0">
									<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" stroke="#13B440" strokeWidth="2" strokeLinecap="round"/>
									</svg>
									<span className="text-success  ms-1 me-1">45%</span> This week
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="30" cy="30" r="30" fill="white"/>
									<path d="M30.5438 0.00501883C13.9681 -0.294993 0.305031 12.893 0.00501883 29.4562C-0.294993 46.0194 12.893 59.695 29.4562 59.995C46.0194 60.295 59.695 47.1069 59.995 30.5313C60.295 13.9681 47.1069 0.292531 30.5438 0.00501883ZM29.5562 54.3697C16.1182 54.1197 5.38024 42.9943 5.63025 29.5562C5.86776 16.1182 16.9932 5.38024 30.4313 5.61775C43.8818 5.86776 54.6072 16.9932 54.3697 30.4313C54.1322 43.8693 42.9943 54.6072 29.5562 54.3697Z" fill="#627EEA"/>
									<path d="M30.3963 8.12285C18.3333 7.91034 8.34536 17.5482 8.13285 29.6112C7.90784 41.6617 17.5457 51.6496 29.6087 51.8746C41.6717 52.0871 51.6596 42.4492 51.8721 30.3988C52.0846 18.3358 42.4592 8.34786 30.3963 8.12285ZM30.0025 14.3581L36.954 26.7599L30.61 23.2297C30.2312 23.0197 29.7725 23.0197 29.3937 23.2297L23.0497 26.7599L30.0025 14.3581ZM30.0025 45.6381L23.0497 33.2364L29.3937 36.7665C29.5825 36.8715 29.7925 36.924 30.0012 36.924C30.21 36.924 30.42 36.8715 30.6088 36.7665L36.9528 33.2364L30.0025 45.6381ZM30.0025 34.2427L22.3722 29.9975L30.0025 25.7523L37.6315 29.9975L30.0025 34.2427Z" fill="#627EEA"/>
								</svg>
							</div>
							<div>
								<h2 className="invoice-num">$168,331.09</h2>
								<p className="mb-0">
									<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1 1C1.91797 2.08433 4.89728 5.27228 6.5 7L12.5 4L19.5 13" stroke="#F04444" strokeWidth="2" strokeLinecap="round"/>
									</svg>

									<span className="text-danger ms-1 me-1">45%</span> This week
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="30" cy="30" r="30" fill="white"/>
									<path d="M30.5438 0.00501883C13.9681 -0.294993 0.305031 12.893 0.00501883 29.4562C-0.294993 46.0194 12.893 59.695 29.4562 59.995C46.0194 60.295 59.695 47.1069 59.995 30.5313C60.295 13.9681 47.1069 0.292531 30.5438 0.00501883ZM29.5562 54.3697C16.1182 54.1197 5.38024 42.9943 5.63025 29.5562C5.86776 16.1182 16.9932 5.38024 30.4313 5.61775C43.8818 5.86776 54.6072 16.9932 54.3697 30.4313C54.1322 43.8693 42.9943 54.6072 29.5562 54.3697Z" fill="#345D9D"/>
									<path d="M30.3963 8.12285C18.3333 7.91034 8.34536 17.5482 8.13285 29.6112C7.90784 41.6617 17.5457 51.6496 29.6087 51.8746C41.6717 52.0871 51.6596 42.4492 51.8721 30.3988C52.0846 18.3358 42.4592 8.34786 30.3963 8.12285ZM39.4091 42.6993H19.5083L21.9459 29.2112L19.1208 29.7987V27.4986L22.3709 26.8111L24.4835 15.2106H32.4213L30.6213 25.086L33.3964 24.4985V26.7986L30.1962 27.4611L28.3462 37.6616H40.8842L39.4091 42.6993Z" fill="#345D9D"/>
								</svg>
							</div>
							<div>
								<h2 className="invoice-num">$7,784</h2>
								<p className="mb-0">
									<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1 1C1.91797 2.08433 4.89728 5.27228 6.5 7L12.5 4L19.5 13" stroke="#F04444" strokeWidth="2" strokeLinecap="round"/>
									</svg>

									<span className="text-danger ms-1 me-1">45%</span> This week
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="row">
				<div className="col-xl-3 col-xxl-4">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h4 className="fs-20 mb-0">Current Statistic</h4>
						</div>
						<div className="card-body">
							<div id="currentChart">
								<CurrentRadialApex />
							</div>
							<div className="chart-content">	
								<div className="d-flex justify-content-between mb-2 align-items-center">
									<div>
										<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect width="15" height="15" rx="7.5" fill="#EB8153"/>
										</svg>
										<span className="fs-14">Income (66%)</span>
									</div>
									<div>
										<h5 className="mb-0">$167,884.21</h5>
									</div>
								</div>
								<div className="d-flex justify-content-between mb-2 align-items-center">
									<div>
										<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect width="15" height="15" rx="7.5" fill="#4441DE"/>
										</svg>
										<span className="fs-14">Spends (50%))</span>
									</div>
									<div>
										<h5 className="mb-0">$56,411.33</h5>
									</div>
								</div>
								<div className="d-flex justify-content-between mb-2 align-items-center">
									<div>
										<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect width="15" height="15" rx="7.5" fill="#60C695"/>
										</svg>
										<span className="fs-14">Installment (11%)</span>
									</div>
									<div>
										<h5 className="mb-0">$81,981.22</h5>
									</div>
								</div>
								<div className="d-flex justify-content-between mb-2 align-items-center">
									<div>
										<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect width="15" height="15" rx="7.5" fill="#F34F80"/>
										</svg>
										<span className="fs-14">Invest (23%)</span>
									</div>
									<div>
										<h5 className="mb-0">$12,432.51</h5>
									</div>
								</div>
							</div>	
						</div>
					</div>
				</div>
				<div className="col-xl-9 col-xxl-8">
					<div className="card">
						<div className="card-header pb-0 border-0 flex-wrap">
							<div className="mb-3">
								<h4 className="fs-20 text-black">Market Overview</h4>
								<p className="mb-0 fs-12 text-black">Lorem ipsum dolor sit amet, consectetur</p>
							</div>
							<div className="d-flex flex-wrap mb-2">
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input type="checkbox" className="form-check-input" id="customCheckBox1" required />
									<label className="form-check-label" htmlFor="customCheckBox1">ETH</label>
								</div>
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input type="checkbox" className="form-check-input" id="customCheckBox2" required />
									<label className="form-check-label" htmlFor="customCheckBox2">XMR</label>
								</div>
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input type="checkbox" className="form-check-input" id="customCheckBox3" required />
									<label className="form-check-label" htmlFor="customCheckBox3">LTC</label>
								</div>
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input type="checkbox" className="form-check-input" id="customCheckBox4" required />
									<label className="form-check-label" htmlFor="customCheckBox4">XMR</label>
								</div>
							</div>
							<Dropdown className=" weather-btn mb-2">
								<Dropdown.Toggle variant="" as="div" className="form-control style-2 default-select border text-primary cursor-pointer">{duration2} </Dropdown.Toggle>
								<Dropdown.Menu >
									<Dropdown.Item onClick={() => setDuration2("Weekly (2021)")}>Weekly (2021)</Dropdown.Item>
									<Dropdown.Item onClick={() => setDuration2("Daily (2021)")}>Daily (2021)</Dropdown.Item>
									<Dropdown.Item onClick={() => setDuration2("Yearly (2021)")}>Yearly (2021)</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
							
						</div>
						<div className="card-body pb-0 pt-3">
							<div id="marketChart" className="market-line">
								<MarketLineApex />
							</div>
						</div>
					</div>
				</div>
				<CardSlider />				
				<div className="col-xl-12">
					<div className="row">
						<PreviousTab />
						<div className="col-xl-3 col-xxl-6 col-md-6">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4 className="mb-0 fs-20 text-black">Sell Order</h4>
									<Dropdown className="dropdown custom-dropdown mb-0">
										<Dropdown.Toggle variant="" as="div" className="btn sharp tp-btn dark-btn i-false" >	
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</Dropdown.Toggle>	
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right" >
											<Dropdown.Item >Details </Dropdown.Item>
											<Dropdown.Item className="text-danger">Cancel </Dropdown.Item>		
										</Dropdown.Menu>			
									</Dropdown>
								</div>
								<div className="card-body px-4">
									<Dropdown className="dropdown custom-dropdown d-block tbl-orders">
										<Dropdown.Toggle variant="" as="div" className="btn  d-flex align-items-center border-0 order-bg rounded  i-false" >	
											<svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M23.4169 0.00384777C10.7089 -0.226161 0.233857 9.88466 0.00384777 22.5831C-0.226161 35.2815 9.88466 45.7661 22.5831 45.9961C35.2815 46.2261 45.7661 36.1153 45.9961 23.4073C46.2261 10.7089 36.1153 0.224273 23.4169 0.00384777ZM22.6598 41.6834C12.3573 41.4918 4.12485 32.9622 4.31652 22.6598C4.49861 12.3573 13.0281 4.12485 23.3306 4.30694C33.6427 4.49861 41.8655 13.0281 41.6834 23.3306C41.5013 33.6331 32.9622 41.8655 22.6598 41.6834Z" fill="#374C98"/>
												<path d="M23.3038 6.22751C14.0555 6.06459 6.3981 13.4536 6.23518 22.7019C6.06267 31.9406 13.4517 39.598 22.7 39.7705C31.9483 39.9334 39.6057 32.5444 39.7686 23.3057C39.9315 14.0574 32.5521 6.40002 23.3038 6.22751ZM30.2136 32.7361H14.9564L16.8252 22.3952L14.6593 22.8457V21.0823L17.151 20.5552L18.7707 11.6615H24.8563L23.4763 19.2326L25.6039 18.7822V20.5456L23.1504 21.0535L21.732 28.8738H31.3445L30.2136 32.7361Z" fill="#374C98"/>
											</svg>
											<div className="text-start ms-3">
												<span className="d-block fs-16 text-black">Litecoin</span>
											</div>
											<i className="fa fa-angle-down scale5 ms-auto"></i>
										</Dropdown.Toggle>	
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right" >
											<Dropdown.Item>Bitcoin </Dropdown.Item>
											<Dropdown.Item>ETH coin </Dropdown.Item>		
										</Dropdown.Menu>			
									</Dropdown>
									<div className="table-responsive">
										<OrderData />
									</div>
								</div>
							</div>	
						</div>
						<div className="col-xl-3 col-xxl-6 col-md-6">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4 className="mb-0 text-black fs-20">Buy Order</h4>
									<Dropdown className="dropdown custom-dropdown mb-0 tbl-orders-style">
										<Dropdown.Toggle variant="" as="div" className="btn sharp tp-btn dark-btn i-false" >	
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</Dropdown.Toggle>	
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right" >
											<Dropdown.Item >Details </Dropdown.Item>
											<Dropdown.Item className="text-danger">Cancel </Dropdown.Item>		
										</Dropdown.Menu>			
									</Dropdown>
								</div>
								<div className="card-body pb-0 px-4">
									<Dropdown className="dropdown custom-dropdown d-block tbl-orders">
										<Dropdown.Toggle variant="" as="div" className="btn  d-flex align-items-center border-0 order-bg rounded  i-false" >	
											<svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M23.4169 0.00384778C10.7089 -0.226162 0.233857 9.88467 0.00384778 22.5831C-0.226162 35.2816 9.88467 45.7662 22.5831 45.9962C35.2816 46.2262 45.7662 36.1153 45.9962 23.4073C46.2262 10.7089 36.1153 0.224274 23.4169 0.00384778ZM22.6598 41.6835C12.3573 41.4918 4.12485 32.9623 4.31653 22.6598C4.49862 12.3573 13.0281 4.12485 23.3306 4.30694C33.6427 4.49862 41.8656 13.0281 41.6835 23.3306C41.5014 33.6332 32.9623 41.8656 22.6598 41.6835Z" fill="#FF782C"/>
												<path d="M23.3019 6.22369C14.0536 6.06076 6.3962 13.4498 6.23327 22.6981C6.17864 25.6077 6.8773 28.3592 8.14427 30.7705H13.4163V14.2616C13.4163 13.2524 14.7877 12.9313 15.2334 13.837L23 29.5649L30.7667 13.838C31.2123 12.9313 32.5837 13.2524 32.5837 14.2616V30.7705H37.8395C39.0182 28.5298 39.7198 25.9997 39.7667 23.3019C39.9297 14.0536 32.5502 6.3962 23.3019 6.22369Z" fill="#FF782C"/>
												<path d="M30.667 31.7289V18.3672L23.8587 32.1534C23.5367 32.808 22.4624 32.808 22.1403 32.1534L15.333 18.3672V31.7289C15.333 32.2579 14.9046 32.6872 14.3746 32.6872H9.34223C12.3237 36.8763 17.1712 39.6632 22.6981 39.7667C28.4455 39.8683 33.5747 37.0507 36.6769 32.6872H31.6254C31.0954 32.6872 30.667 32.2579 30.667 31.7289Z" fill="#FF782C"/>
											</svg>
											<div className="text-left ms-3">
												<span className="d-block fs-16 text-black">Monero</span>
											</div>
											<i className="fa fa-angle-down scale5 ms-auto"></i>
										</Dropdown.Toggle>
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right">
											<Dropdown.Item className="dropdown-item">Dash coin</Dropdown.Item>
											<Dropdown.Item className="dropdown-item">ETH coin</Dropdown.Item>
										</Dropdown.Menu>
									</Dropdown>
									<div className="table-responsive">
										<OrderData />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>	
				<div className="col-xl-12">
					<div className="row">
						<div className="col-xl-6 col-xxl-12">
							<QuickTransfer />
						</div>
						<div className="col-xl-6 col-xxl-12">
							<QuickTrade />
						</div>
					</div>
				</div>
			</div>	
		</>
	)
}
export default Home;