import React,{Fragment,useState, useRef, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Dropdown} from 'react-bootstrap';
import {ArrowUp,ArrowDown, CoinIcon1, 
	CoinIcon2, CoinIcon3, CoinIcon4	} 
from "../Boltz/Transactions/TableData";
import { useWallet } from '../../../context/WalletContext.js';
import { useUserTransactions } from '../../../hooks/useUserTransactions.js';
import ConnectWalletButton from '../Web3/ConnectWalletButton.js';

const coinIconMap = {
	'BTC': CoinIcon1,
	'ETH': CoinIcon2,
	'LTC': CoinIcon3,
	'SOL': CoinIcon4,
	'USDC': CoinIcon1,
	'default': CoinIcon1
};

const Transactions = () => {
	const { address, isConnected } = useWallet();
	const { transactions, loading, error } = useUserTransactions(60000, 200);
	const [country1, setCountry1] = useState("Medan, IDN");
	const [sort, setSort] = useState(8);
	const activePag = useRef(0);
	const [test, settest] = useState(0);
	const [displayedTransactions, setDisplayedTransactions] = useState([]);

	useEffect(() => {
		if (transactions && transactions.length > 0) {
			const start = activePag.current * sort;
			const end = start + sort;
			setDisplayedTransactions(transactions.slice(start, end));
		}
	}, [transactions, sort, test]);

	const pagination = Math.ceil((transactions?.length || 0) / sort);

	const onClick = (i) => {
		activePag.current = i;
		settest(i);
	};

	const formatDate = (timestamp) => {
		return new Date(timestamp).toLocaleString('es-ES', {
			month: '2-digit',
			day: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getCoinIcon = (coin) => {
		const symbol = coin?.toUpperCase() || 'BTC';
		return coinIconMap[symbol] || coinIconMap['default'];
	};

	const formatAmount = (transaction) => {
		if (transaction.type === 'trade') {
			const total = transaction.price * transaction.amount;
			return transaction.side === 'buy' ? `-$${total.toFixed(2)}` : `+$${total.toFixed(2)}`;
		}
		return transaction.type === 'deposit' ? `+$${transaction.amount.toFixed(2)}` : `-$${transaction.amount.toFixed(2)}`;
	};

	const getStatusColor = (status) => {
		switch(status) {
			case 'COMPLETED':
				return 'text-success';
			case 'PENDING':
				return 'text-light';
			case 'CANCELED':
				return 'text-danger';
			default:
				return 'text-success';
		}
	};

	if (!isConnected) {
		return (
			<Fragment>
				<div className="mb-sm-5 mb-3 d-flex flex-wrap align-items-center text-head">
					<h2 className="font-w600 mb-2 me-auto">Transactions List</h2>
				</div>
				<div className="card">
					<div className="card-body text-center py-5">
						<i className="fa fa-wallet fa-3x text-muted mb-3"></i>
						<h5 className="mb-3">Conecta tu Wallet</h5>
						<p className="text-muted mb-4">Conecta tu wallet para ver tu historial de transacciones en Hyperliquid</p>
						<ConnectWalletButton />
					</div>
				</div>
			</Fragment>
		);
	}

	if (loading) {
		return (
			<Fragment>
				<div className="mb-sm-5 mb-3 d-flex flex-wrap align-items-center text-head">
					<h2 className="font-w600 mb-2 me-auto">Transactions List</h2>
				</div>
				<div className="card">
					<div className="card-body text-center py-5">
						<div className="spinner-border text-primary" role="status">
							<span className="visually-hidden">Cargando...</span>
						</div>
						<p className="mt-2 text-muted">Cargando transacciones...</p>
					</div>
				</div>
			</Fragment>
		);
	}

	if (error) {
		return (
			<Fragment>
				<div className="mb-sm-5 mb-3 d-flex flex-wrap align-items-center text-head">
					<h2 className="font-w600 mb-2 me-auto">Transactions List</h2>
				</div>
				<div className="card">
					<div className="card-body">
						<div className="alert alert-warning" role="alert">
							<strong>Error:</strong> {error}
						</div>
					</div>
				</div>
			</Fragment>
		);
	}

	return(
		<Fragment>
			<div className="mb-sm-5 mb-3 d-flex flex-wrap align-items-center text-head">
				<h2 className="font-w600 mb-2 me-auto">Transactions List</h2>
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
					<div className="table-responsive table-hover fs-14">
						<div id="example5_wrapper" className="dataTables_wrapper no-footer">
							<table className="table display mb-4 dataTablesCard short-one card-table text-black tbl-link dataTable no-footer" id="transaction_table">
								<thead>
									<tr role="row">
										<th className="sorting_asc">
											<div className="checkbox me-0 align-self-center">
												<div className="form-check me-0 custom-checkbox ">
													<input type="checkbox" className="form-check-input" id="checkAll" required/>
													<label className="form-check-label" htmlFor="checkAll"/>
												</div>
											</div>
										</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}> Transaction ID</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}>Date</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}>From</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}> To</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}>Coin</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}>Amount</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}>Note</th>
										<th className="sorting" tabIndex={0} rowSpan={1} colSpan={1}>Status</th>
									</tr>
								</thead>
								<tbody>
									{displayedTransactions.length === 0 ? (
										<tr>
											<td colSpan="9" className="text-center py-4 text-muted">
												No hay transacciones disponibles
											</td>
										</tr>
									) : (
										displayedTransactions.map((transaction, index) => {
											const CoinIcon = getCoinIcon(transaction.coin);
											const isBuy = transaction.side === 'buy' || transaction.type === 'deposit';
											return (
												<tr key={transaction.id || index} role="row" className={index % 2 === 0 ? "odd" : "even"}>
													<td className="pe-0 sorting_1">{isBuy ? <ArrowUp /> : <ArrowDown />}</td>
													<td>#{transaction.id?.slice(0, 16) || transaction.id}</td>
													<td>{formatDate(transaction.date || transaction.timestamp)}</td>
													<td>{transaction.from || address?.slice(0, 6) + '...' + address?.slice(-4)}</td>
													<td>{transaction.to || 'Hyperliquid'}</td>
													<td className="wspace-no"><CoinIcon /></td>
													<td><span className={`text-black font-w600 ${isBuy ? '' : ''}`}>{formatAmount(transaction)}</span></td>
													<td><p className="mb-0 wspace-no">{transaction.note || 'N/A'}</p></td>
													<td><Link to="/transactions" className={`btn-link float-end ${getStatusColor(transaction.status)}`}>{transaction.status || 'COMPLETED'}</Link></td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
							{pagination > 1 && (
								<div className="d-sm-flex text-center justify-content-between align-items-center mt-3">
									<div className="dataTables_info">
										Mostrando {activePag.current * sort + 1} a {Math.min((activePag.current + 1) * sort, transactions.length)} de {transactions.length} transacciones
									</div>
									<div className="dataTables_paginate paging_simple_numbers" id="example5_paginate">
										<ul className="pagination pagination-primary-transparent d-inline-block d-md-flex gap-2">
											{Array.from({ length: pagination }, (_, i) => i).map((i) => (
												<li key={i} className={`paginate_button page-item ${activePag.current === i ? 'active' : ''}`}>
													<Link to="#" onClick={(e) => { e.preventDefault(); onClick(i); }} className="page-link">
														{i + 1}
													</Link>
												</li>
											))}
										</ul>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
}

export default Transactions;
