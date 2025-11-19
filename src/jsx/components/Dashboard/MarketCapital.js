import React, { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import {  Sparklines, SparklinesLine } from 'react-sparklines';
import {CoinIcon5,CoinIcon6, CoinIcon7, CoinIcon8} from "../Boltz/Transactions/TableData";
import { useMarketOverview } from "../../../hooks/useMarketOverview";

const sampleData1 = [2,2,2,4,4,5,4,6,5,7,6,8,7,9,8,4,7,6,8,7];
const sampleData2 = [2,3,4,5,6,5,4,6,5,7,2,3,4,5,3,2,5,4,5,7];
const sampleData3 = [2,2,4,3,2,4,3,3,4,2,1,3,2,4,2,3,5,4,3,2];
const sampleData4 = [6,2,3,2,3,5,3,3,7,2,4,7,5,1,3,6,5,9];
const sampleData5 = [6,2,3,2,3,5,4,3,2,2,4,5,2,5,5,4,3,1,3,4,5,6];
const sampleData6 = [1,2,3,1,4,2,4,2,2,1,2,5,1,4,1,1,5,4,3,2,4,2];
const sampleData7 = [2,3,4,5,6,5,4,6,5,7,2,3,4,5,3,2,5,4,5,7];
const sampleData8 = [2,2,2,4,4,5,4,6,5,7,6,8,7,9,8,4,7,6,8,7];
const sampleData9 = [1,2,3,1,4,2,4,2,2,1,2,5,1,4,1,1,5,4,3,2,4,2];

const MarketCapital = () => {
	const [country1, setCountry1] = useState("Medan, IDN");		
	const { marketData, loading, error } = useMarketOverview(30000); // Actualizar cada 30 segundos
	const [data, setData] = useState(document.querySelectorAll("#marketCapital tbody tr"));
	const sort = 9;
	const activePag = useRef(0);
	const [test, settest] = useState(0);
	
	// Formatear moneda
	const formatCurrency = (value) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(value);
	};
	
	// Formatear volumen (millones, billones)
	const formatVolume = (value) => {
		if (value >= 1e9) {
			return `$${(value / 1e9).toFixed(2)}B`;
		} else if (value >= 1e6) {
			return `$${(value / 1e6).toFixed(2)}M`;
		} else if (value >= 1e3) {
			return `$${(value / 1e3).toFixed(2)}K`;
		}
		return `$${value.toFixed(2)}`;
	};
	
	// Generar datos aleatorios para sparkline (temporal)
	const generateSparklineData = () => {
		return Array.from({ length: 20 }, () => Math.floor(Math.random() * 10) + 1);
	};

  // Active data
	const chageData = (frist, sec) => {
		for (var i = 0; i < data.length; ++i) {
			if (i >= frist && i < sec) {
				data[i].classList.remove("d-none");
			} else {
				data[i].classList.add("d-none");
			}
		}
	};
  // use effect
	useEffect(() => {
		setData(document.querySelectorAll("#marketCapital tbody tr"));
	}, [test]);

  // Active pagginarion
	activePag.current === 0 && chageData(0, sort);
	// paggination
	let paggination = Array(Math.ceil(data.length / sort))
		.fill()
		.map((_, i) => i + 1);

  // Active paggination & chage data
	const onClick = (i) => {
		activePag.current = i;
		chageData(activePag.current * sort, (activePag.current + 1) * sort);
		settest(i);
	};
	const DropDownBlog =() =>{
		return(
			<>
				<Dropdown className=" ml-4">
					<Dropdown.Toggle variant="" className="i-false p-0 btn-link" data-toggle="dropdown">
						<svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
								stroke="#A7A7A7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
							<path
								d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
								stroke="#A7A7A7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
							<path
								d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
								stroke="#A7A7A7"strokeWidth={2}  strokeLinecap="round" strokeLinejoin="round"
							/>
						</svg>
					</Dropdown.Toggle>
					<Dropdown.Menu className="dropdown-menu dropdown-menu-right" alignRight={true}>
						<Link to={"#"} className="dropdown-item" >Edit</Link>
						<Link to={"#"} className="dropdown-item" >Delete</Link>
					</Dropdown.Menu>
				 </Dropdown>
			</>
		)
	}
	
  return (
    <>
       <div className="mb-sm-5 mb-3 d-flex flex-wrap align-items-center text-head">
			<h2 className="font-w600 mb-2 me-auto">Market Capital</h2>
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
			<div className="col-xl-12">
				<div className="table-responsive table-hover fs-14 ">
					<div id="example6_wrapper" className="dataTables_wrapper no-footer">
						<table className="table display mb-4 dataTablesCard font-w600  market-tbl border-no text-black dataTable no-footer border-0" 
							id="marketCapital" role="grid" aria-describedby="example6_info">
							<thead>
								<tr role="row">
									<th className="sorting_asc" tabIndex={0}  rowSpan={1} colSpan={1}>Rank</th>
									<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1}>Coin</th>
									<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1}>Last Price</th>
									<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1}>Change (24h)</th>
									<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1}>Volume (24h)</th>
									<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1}>Graph</th>
									<th className="bg-none width50 sorting" tabIndex={0} aria-controls="example6" rowSpan={1} colSpan={1}/>
							   </tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td colSpan="7" className="text-center py-4">
											<div className="spinner-border text-primary" role="status">
												<span className="visually-hidden">Cargando...</span>
											</div>
										</td>
									</tr>
								) : error ? (
									<tr>
										<td colSpan="7" className="text-center text-danger py-4">
											Error: {error}
										</td>
									</tr>
								) : marketData.length === 0 ? (
									<tr>
										<td colSpan="7" className="text-center py-4">
											No hay datos disponibles
										</td>
									</tr>
								) : (
									marketData.map((coin, index) => (
										<tr key={`${coin.coin}-${coin.rank}-${index}`} role="row" className={index < 3 ? (index % 2 === 0 ? "odd market-trbg" : "even market-trbg") : (index % 2 === 0 ? "odd" : "even")}>
											<td className="sorting_1">
												<span className={`rank-ic fs-20 ${index < 3 ? 'bg-primary text-white' : ''}`}>
													#{coin.rank}
												</span>
											</td>
											<td className="wspace-no">
												<div className="d-flex align-items-center">
													<div className="coin-icon me-2">
														{index % 4 === 0 && <CoinIcon5 />}
														{index % 4 === 1 && <CoinIcon6 />}
														{index % 4 === 2 && <CoinIcon7 />}
														{index % 4 === 3 && <CoinIcon8 />}
													</div>
													<span className="font-w600 text-black">{coin.coin}</span>
												</div>
											</td>
											<td className="font-w600">{formatCurrency(coin.lastPrice)}</td>
											<td>
												<span className={coin.change24h >= 0 ? 'text-success' : 'text-danger'}>
													{coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
												</span>
											</td>
											<td>{formatVolume(coin.volume24h)}</td>
											<td>
												<svg className="peity-line" width="280" height="50">
													<Sparklines data={generateSparklineData()}>
														<SparklinesLine 
															style={{ 
																strokeWidth: 4, 
																stroke: coin.change24h >= 0 ? "#2BC155" : "#FF2E2E", 
																fill: "none" 
															}} 
														/>
													</Sparklines>		
												</svg>
											</td>
											<td><DropDownBlog /></td>
										</tr>
									))
								)}
							</tbody>
						</table>
						<div className="d-sm-flex text-center justify-content-between align-items-center mt-3">
							<div className="dataTables_info">
								  {!loading && marketData.length > 0 ? (
									<>
										Mostrando {marketData.length} criptomonedas principales por volumen
									</>
								  ) : null}
							</div>
							<div className="dataTables_paginate paging_simple_numbers" id="example5_paginate">
								{/* Paginación simplificada para datos en tiempo real */}
								<span className="text-muted">
									Actualización automática cada 30 segundos
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
    </>
  );
};

export default MarketCapital;
