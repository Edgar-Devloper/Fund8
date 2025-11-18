import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import {Dropdown} from 'react-bootstrap';

import pic1 from './../../../images/profile/pic1.jpg';
import WalletTab from "../Boltz/MyWallet/WalletTab";

const SummarApexBar = loadable(() =>
	pMinDelay(import("../Boltz/Portfolio/SummarApexBar"), 1000)
);
const CurrentApexBar = loadable(() =>
	pMinDelay(import("../Boltz/Portfolio/CurrentApexBar"), 1000)
);
const CurrentApexDonut = loadable(() =>
	pMinDelay(import("../Boltz/Portfolio/CurrentApexDonut"), 1000)
);


const DropdownBlog = ()=>{
	return(
		<>
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
		</>
	)
}


const Portofolio = () =>{
	const [country1, setCountry1] = useState("Medan, IDN");	
	return(
		<>
			<div className="mb-sm-5 mb-3 d-flex flex-wrap align-items-center text-head">
				<h2 className="font-w600 mb-2 me-auto">Portofolio</h2>
				<Dropdown className=" weather-btn mb-2">
					<span className="fs-22 font-w600 d-flex"><i className="fa fa-cloud me-3 ms-3"></i>21</span>
					<Dropdown.Toggle variant="" as="div" className="form-control style-3 default-select">{country1} </Dropdown.Toggle>
					<Dropdown.Menu >
						<Dropdown.Item onClick={() => setCountry1("Medan, IDN")}>Medan, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Jakarta, IDN")}>Jakarta, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Surabaya, IDN")}>Surabaya, IDN</Dropdown.Item>
					 </Dropdown.Menu>
				</Dropdown>
				<Link to={"#"} className="btn btn-primary mb-2 rounded"><i className="las la-calendar scale5 me-3"></i>Filter Periode</Link>
			</div>
			<div className="row">
				<div className="col-xl-9 col-xxl-8">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h4 className="mb-0 fs-20 text-black">Coin Holding</h4>
							<DropdownBlog />
						</div>
						<div className="card-body">
							<div className="bg-gradient-1 coin-holding flex-wrap">
								<div className="mb-2 coin-bx">
									<div className="d-flex align-items-center">
										<div>
											<svg width="61" height="60" viewBox="0 0 61 60" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M31.4825 0.00501883C14.9181 -0.294993 1.2643 12.893 0.964488 29.4562C0.664679 46.0194 13.8438 59.6949 30.3957 59.9949C46.9477 60.2949 60.6139 47.1069 60.9138 30.5312C61.2136 13.9681 48.0345 0.29253 31.4825 0.00501883ZM30.4957 54.3697C17.0667 54.1197 6.33606 42.9942 6.5859 29.5562C6.82325 16.1182 17.9412 5.38023 31.3701 5.61774C44.8115 5.86775 55.5297 16.9932 55.2923 30.4312C55.055 43.8693 43.9246 54.6072 30.4957 54.3697Z" fill="#627EEA"/>
												<path d="M31.3351 8.12284C19.2803 7.91034 9.29917 17.5482 9.08681 29.6112C8.86195 41.6617 18.4933 51.6496 30.5481 51.8746C42.6029 52.0871 52.5841 42.4492 52.7964 30.3987C53.0088 18.3358 43.3899 8.34785 31.3351 8.12284ZM30.9416 14.3581L37.8884 26.7598L31.5487 23.2297C31.1702 23.0197 30.7118 23.0197 30.3333 23.2297L23.9936 26.7598L30.9416 14.3581ZM30.9416 45.6381L23.9936 33.2364L30.3333 36.7665C30.5219 36.8715 30.7318 36.924 30.9404 36.924C31.149 36.924 31.3589 36.8715 31.5475 36.7665L37.8872 33.2364L30.9416 45.6381ZM30.9416 34.2426L23.3165 29.9975L30.9416 25.7523L38.5655 29.9975L30.9416 34.2426Z" fill="#627EEA"/>
											</svg>
										</div>
										<div className="ms-3">
											<h4 className="coin-font font-w600 mb-0">Ethereum</h4>
											<p className="mb-0 op-6">ETH</p>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<div className="coin-bx-one">
											<svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect width="4.71106" height="34.5712" rx="2.35553" transform="matrix(-1 0 0 1 33.6851 0)" fill="#13B440"/>
												<rect width="4.71106" height="25.1427" rx="2.35553" transform="matrix(-1 0 0 1 24.2632 9.42847)" fill="#13B440"/>
												<rect width="4.71106" height="10.9999" rx="2.35553" transform="matrix(-1 0 0 1 14.8413 23.5713)" fill="#13B440"/>
												<rect width="5.31504" height="21.2746" rx="2.65752" transform="matrix(-1 0 0 1 6.02246 13.2966)" fill="#13B440"/>
											</svg>
										</div>	
										<div className="ms-3">
											<h2 className="mb-0 text-primary coin-font-1">$667,224</h2>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" stroke="#2BC155" strokeWidth="2" strokeLinecap="round"/>
										</svg>
										<p className="mb-0 ms-2 text-success">45%</p>
										<p className="mb-0 ms-2 font-w400 text-black">This Week</p>	
									</div>
								</div>
							</div>
							<div className="bg-gradient-2 coin-holding mt-4 flex-wrap">
								<div className="mb-2 coin-bx">
									<div className="d-flex align-items-center">
										<div>
											<svg width="61" height="60" viewBox="0 0 61 60" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M31.4859 0.00501883C14.9215 -0.294993 1.26771 12.893 0.967906 29.4562C0.668097 46.0194 13.8472 59.6949 30.3991 59.9949C46.9511 60.2949 60.6174 47.1069 60.9172 30.5312C61.217 13.9681 48.0379 0.29253 31.4859 0.00501883ZM30.4991 54.3697C17.0701 54.1197 6.33948 42.9942 6.58932 29.5562C6.82667 16.1182 17.9446 5.38023 31.3735 5.61774C44.8149 5.86775 55.5331 16.9932 55.2958 30.4312C55.0584 43.8693 43.928 54.6072 30.4991 54.3697Z" fill="#345D9D"/>
												<path d="M31.3385 8.12284C19.2837 7.91034 9.30259 17.5482 9.09023 29.6112C8.86537 41.6617 18.4967 51.6496 30.5515 51.8746C42.6063 52.0871 52.5875 42.4492 52.7999 30.3987C53.0122 18.3358 43.3933 8.34785 31.3385 8.12284ZM40.3453 42.6992H20.458L22.8939 29.2112L20.0707 29.7987V27.4986L23.3186 26.8111L25.4298 15.2106H33.3622L31.5634 25.086L34.3366 24.4985V26.7986L31.1387 27.4611L29.2898 37.6615H41.8194L40.3453 42.6992Z" fill="#345D9D"/>
											</svg>
										</div>
										<div className="ms-3">
											<h4 className="coin-font font-w600 mb-0">LiteCoin</h4>
											<p className="mb-0">LTC</p>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<div className="coin-bx-one">
											<svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect width="4.71106" height="34.5712" rx="2.35553" transform="matrix(-1 0 0 1 33.6851 0)" fill="#13B440"/>
												<rect width="4.71106" height="25.1427" rx="2.35553" transform="matrix(-1 0 0 1 24.2632 9.42847)" fill="#13B440"/>
												<rect width="4.71106" height="10.9999" rx="2.35553" transform="matrix(-1 0 0 1 14.8413 23.5713)" fill="#13B440"/>
												<rect width="5.31504" height="21.2746" rx="2.65752" transform="matrix(-1 0 0 1 6.02246 13.2966)" fill="#13B440"/>
											</svg>
										</div>	
										<div className="ms-3">
											<h2 className="mb-0 text-primary coin-font-1">$168,331.09</h2>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<svg width="29" height="22" viewBox="0 0 29 22" fill="none" xmlns="http://www.w3.org/2000/svg">
											<g filter="url(#filter0_d)">
											<path d="M5 4C5.91797 5.08433 8.89728 8.27228 10.5 10L16.5 7L23.5 16" stroke="#FF2E2E" strokeWidth="2" strokeLinecap="round"/>
											</g>
											<defs>
											<filter id="filter0_d" x="0" y="0" width="28.5001" height="22.0001" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
											<feFlood flood-opacity="0" result="BackgroundImageFix"/>
											<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
											<feOffset dy="1"/>
											<feGaussianBlur stdDeviation="2"/>
											<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.180392 0 0 0 0 0.180392 0 0 0 0.61 0"/>
											<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
											<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
											</filter>
											</defs>
										</svg>

										<p className="mb-0 ms-2 text-danger">45%</p>
										<p className="mb-0 ms-2 font-w400 text-black">This Week</p>	
									</div>
								</div>
							</div>
							<div className="bg-gradient-3 coin-holding mt-4 flex-wrap">
								<div className="mb-2 coin-bx">
									<div className="d-flex align-items-center">
										<div>
											<svg width="61" height="60" viewBox="0 0 61 60" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M30.9426 0C14.385 0 0.962891 13.4312 0.962891 30C0.962891 46.5688 14.385 60 30.9426 60C47.5001 60 60.9222 46.5688 60.9222 30C60.9222 13.4312 47.5001 0 30.9426 0ZM30.9426 54.375C17.5104 54.375 6.58408 43.44 6.58408 30C6.58408 16.56 17.5104 5.625 30.9426 5.625C44.3747 5.625 55.301 16.5588 55.301 30C55.301 43.4412 44.3735 54.375 30.9426 54.375Z" fill="#F7931A"/>
												<path d="M32.4903 30.9737H28.5542V36.825H32.4903C33.2847 36.825 34.0217 36.5025 34.5389 35.9612C35.0798 35.4425 35.4021 34.7062 35.4021 33.8875C35.4033 32.2862 34.0904 30.9737 32.4903 30.9737Z" fill="#F7931A"/>
												<path d="M30.9426 8.12496C18.8882 8.12496 9.08239 17.9375 9.08239 30C9.08239 42.0625 18.8882 51.875 30.9426 51.875C42.9969 51.875 52.8027 42.0612 52.8027 30C52.8027 17.9387 42.9956 8.12496 30.9426 8.12496ZM35.3908 40.13H32.8125V44.185H30.1081V40.13H28.6229V44.185H25.906V40.13H21.1292V37.585H23.7649V22.335H21.1292V19.79H25.906V15.8162H28.6229V19.79H30.1081V15.8162H32.8125V19.79H35.161C36.4726 19.79 37.6817 20.3312 38.5449 21.195C39.4081 22.0587 39.949 23.2687 39.949 24.5812C39.949 27.15 37.9228 29.2462 35.3908 29.3612C38.36 29.3612 40.7547 31.78 40.7547 34.7512C40.7547 37.7112 38.3613 40.13 35.3908 40.13Z" fill="#F7931A"/>
												<path d="M34.2291 27.38C34.7013 26.9075 34.9886 26.2737 34.9886 25.56C34.9886 24.1437 33.8381 22.9912 32.4216 22.9912H28.5542V28.14H32.4216C33.1236 28.14 33.7682 27.84 34.2291 27.38Z" fill="#F7931A"/>
											</svg>
										</div>
										<div className="ms-3">
											<h4 className="coin-font font-w600 mb-0">BitCoin</h4>
											<p className="mb-0">BTH</p>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<div className="coin-bx-one">
											<svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect width="4.71106" height="34.5712" rx="2.35553" transform="matrix(-1 0 0 1 33.6851 0)" fill="#13B440"/>
												<rect width="4.71106" height="25.1427" rx="2.35553" transform="matrix(-1 0 0 1 24.2632 9.42847)" fill="#13B440"/>
												<rect width="4.71106" height="10.9999" rx="2.35553" transform="matrix(-1 0 0 1 14.8413 23.5713)" fill="#13B440"/>
												<rect width="5.31504" height="21.2746" rx="2.65752" transform="matrix(-1 0 0 1 6.02246 13.2966)" fill="#13B440"/>
											</svg>
										</div>	
										<div className="ms-3">
											<h2 className="mb-0 text-primary coin-font-1">$667,224</h2>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" stroke="#2BC155" strokeWidth="2" strokeLinecap="round"/>
										</svg>
										<p className="mb-0 ms-2 text-success">45%</p>
										<p className="mb-0 ms-2 font-w400 text-black">This Week</p>	
									</div>
								</div>
							</div>
							<div className="bg-gradient-4 coin-holding mt-4 flex-wrap">
								<div className="mb-2 coin-bx">
									<div className="d-flex align-items-center">
										<div>
											<svg width="61" height="60" viewBox="0 0 61 60" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M31.486 0.00501884C14.9215 -0.294993 1.26772 12.893 0.967906 29.4562C0.668097 46.0194 13.8472 59.695 30.3992 59.995C46.9511 60.295 60.6174 47.107 60.9172 30.5313C61.217 13.9681 48.0379 0.292531 31.486 0.00501884ZM30.4991 54.3698C17.0702 54.1197 6.33949 42.9943 6.58933 29.5562C6.82667 16.1182 17.9446 5.38024 31.3735 5.61775C44.815 5.86776 55.5332 16.9932 55.2958 30.4313C55.0585 43.8693 43.928 54.6073 30.4991 54.3698Z" fill="#FF6803"/>
												<path d="M31.3361 8.11785C19.2812 7.90534 9.3001 17.5432 9.08773 29.6062C9.01653 33.4014 9.9272 36.9903 11.5786 40.1354H18.4505V18.602C18.4505 17.2857 20.2381 16.867 20.819 18.0483L30.9426 38.5629L41.0661 18.0495C41.647 16.867 43.4346 17.2857 43.4346 18.602V40.1354H50.2852C51.8218 37.2128 52.7362 33.9127 52.7974 30.3938C53.0098 18.3308 43.3909 8.34286 31.3361 8.11785Z" fill="#FF6803"/>
												<path d="M40.9362 41.3855V23.9573L32.0619 41.9392C31.6421 42.793 30.2418 42.793 29.822 41.9392L20.9489 23.9573V41.3855C20.9489 42.0755 20.3905 42.6355 19.6997 42.6355H13.1402C17.0264 48.0995 23.3449 51.7346 30.5491 51.8696C38.0405 52.0022 44.7263 48.327 48.77 42.6355H42.1854C41.4946 42.6355 40.9362 42.0755 40.9362 41.3855Z" fill="#FF6803"/>
											</svg>
										</div>
										<div className="ms-3">
											<h4 className="coin-font font-w600 mb-0">Monero</h4>
											<p className="mb-0 ">XMR</p>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<div className="coin-bx-one">
											<svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect width="4.71106" height="34.5712" rx="2.35553" transform="matrix(-1 0 0 1 33.6851 0)" fill="#13B440"/>
												<rect width="4.71106" height="25.1427" rx="2.35553" transform="matrix(-1 0 0 1 24.2632 9.42847)" fill="#13B440"/>
												<rect width="4.71106" height="10.9999" rx="2.35553" transform="matrix(-1 0 0 1 14.8413 23.5713)" fill="#13B440"/>
												<rect width="5.31504" height="21.2746" rx="2.65752" transform="matrix(-1 0 0 1 6.02246 13.2966)" fill="#13B440"/>
											</svg>
										</div>	
										<div className="ms-3">
											<h2 className="mb-0 text-primary coin-font-1">$24,098</h2>
										</div>
									</div>
								</div>
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" stroke="#2BC155" strokeWidth="2" strokeLinecap="round"/>
										</svg>
										<p className="mb-0 ms-2 text-success">45%</p>
										<p className="mb-0 ms-2 font-w400 text-black">This Week</p>	
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-4">
					<div className="card">
						<div className="card-header border-0">
							<h4 className="mb-0 text-black fs-20">My Profile</h4>
							<DropdownBlog />
						</div>
						<div className="card-body">
							<div className="text-center">
								<div className="my-profile">
									<img src={pic1} alt="" className="rounded-circle" />
									<Link to={"#"}><i className="fa fa-pencil" aria-hidden="true"></i></Link>
								</div>
								<h4 className="mt-3 font-w600 text-black mb-0 name-text">William Fancyson</h4>
								<span>@thomasdox</span>
								<p className="mb-0 mt-3 text-primary fs-16">Join on 24 March 2017</p>
								<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt </p>
							</div>
							<ul className="portofolio-social">
								<li><Link to={"#"}><i className="fa fa-phone"></i></Link></li>
								<li><Link to={"#"}><i className="fa fa-envelope-o"></i></Link></li>
								<li><Link to={"#"}><i className="fa fa-facebook"></i></Link></li>
							</ul>
						</div>
					</div>
				</div>
			</div>	
			<div className="row">
				<div className="col-xl-6">
					<div className="row">
						<div className="col-xl-12">
							<WalletTab  activeMenu ="Wallet Activity" />
						</div>
					</div>
				</div>
				<div className="col-xl-6">
					<div className="row">
						<div className="col-xl-12">
							<div className="card">
								<div className="card-header pb-0 border-0">
									<h4 className="fs-20 text-black mb-0">Weekly Summary</h4>
								</div>
								<div className="card-body py-0">
									<div className="d-flex align-items-center justify-content-between">
										<div>
											<span className="d-flex align-items-center">
												<svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect width="22.2609" height="16" rx="8" fill="#13B440"/>
												</svg>
												<span className="mb-0 ms-3 fs-18 font-w500 text-black">30%</span>	
												<span className="mb-0 ms-3">Succesfull Market</span>
											</span>
											<span className="d-flex align-items-center">
												<svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
													<rect y="3.05176e-05" width="22.2609" height="16" rx="8" fill="#FF9574"/>
												</svg>
												<span className="mb-0 ms-3 fs-18 font-w500 text-black">46%</span>	
												<span className="mb-0 ms-3">Failed</span>
											</span>
											<span className="d-flex align-items-center">
												<svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
													<rect width="22.2609" height="16" rx="8" fill="#C4C4C4"/>
												</svg>
												<span className="mb-0 ms-3 fs-18 font-w500 text-black">10%</span>	
												<span className="mb-0 ms-3">Waiting</span>
											</span>
										</div>
										<div id="WeeklysummaryChart">
											<SummarApexBar />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="row">
						<div className="col-xl-6 col-xxl-12 col-md-6">
							<div className="card">
								<div className="card-header pb-0 border-0">
									<h4 className="mb-0 fs-20 text-black">Current Graph</h4>
									<DropdownBlog />
								</div>
								<div className="card-body py-2">
									<CurrentApexBar />
								</div>
							</div>
						</div>
						<div className="col-xl-6 col-xxl-12 col-md-6">
							<div className="card">
								<div className="card-header pb-0 border-0">
									<h4 className="mb-0 fs-20 text-black">Current Graph</h4>
									<DropdownBlog />
								</div>
								<div className="card-body py-2 text-center">
									<div id="pieChart" className="d-inline-block">
										<CurrentApexDonut />
									</div>
									<div className="chart-items">
										<div className=" col-xl-12 col-sm-12">
											<div className="row text-black text-start fs-13 mt-4">
												<span className="mb-3 col-6">
													<svg className="me-2" width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
														<rect width="19" height="19" rx="9.5" fill="#00ADA3"/>
													</svg>
													Ethereum
												</span>
												<span className="mb-3 col-6">
													<svg className="me-2" width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
														<rect width="19" height="19" rx="9.5" fill="#374B96"/>
													</svg>
													Litecoin
												</span>
												<span className="mb-3 col-6">
													<svg className="me-2" width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
														<rect width="19" height="19" rx="9.5" fill="#FF782C"/>
													</svg>
													Monero
												</span>
												<span className="mb-3 col-6">
													<svg className="me-2" width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
														<rect width="19" height="19" rx="9.5" fill="#F7A62C"/>
													</svg>
													Bitcoin
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>		
		</>
	)
}
export default Portofolio; 