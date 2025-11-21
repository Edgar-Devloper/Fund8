import React from 'react';
import {Dropdown} from 'react-bootstrap';
import { useOrderBook } from '../../../../hooks/useOrderBook.js';

const DropDownBlog = ()=>{
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

function Sellorder({ coinId = 'bitcoin' }){
	const { orderBook, loading, error } = useOrderBook(coinId, 30000);
	const asks = orderBook?.asks || [];

	const formatPrice = (price) => {
		if (price === undefined || price === null || isNaN(price)) return '0.00';
		return parseFloat(price).toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	};

	const formatAmount = (amount) => {
		if (amount === undefined || amount === null || isNaN(amount)) return '0.0000';
		return parseFloat(amount).toFixed(4);
	};

	const calculateTotal = (price, amount) => {
		if (price === undefined || price === null || amount === undefined || amount === null || isNaN(price) || isNaN(amount)) {
			return '0.00';
		}
		return (parseFloat(price) * parseFloat(amount)).toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	};

	return(
		<>
			<div className="card">
				<div className="card-header border-0 pb-0">
					<h4 className="mb-0 fs-20 text-black">Sell Order</h4>
					<DropDownBlog />
				</div>
				<div className="card-body pt-3 pb-0">
					{loading && asks.length === 0 ? (
						<div className="text-center py-3">
							<div className="spinner-border spinner-border-sm text-primary" role="status"></div>
						</div>
					) : error && asks.length === 0 ? (
						<div className="text-center py-3 text-muted small">Error cargando datos</div>
					) : asks.length === 0 ? (
						<div className="text-center py-3 text-muted small">Sin órdenes de venta</div>
					) : (
						<div className="table-responsive">
							<table className="table text-center bg-warning-hover tr-rounded order-tbl">
								<thead>
									<tr>
										<th className="text-left">Price</th>
										<th className="text-center">Amount</th>
										<th className="text-right">Total</th>
									</tr>
								</thead>
								<tbody>
									{asks.slice(0, 8).map((order, index) => {
										const price = order?.price || 0;
										const quantity = order?.quantity || order?.size || 0;
										return (
											<tr key={index}>
												<td className="text-left">{formatPrice(price)}</td>
												<td>{formatAmount(quantity)}</td>
												<td className="text-right">${calculateTotal(price, quantity)}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>	
		</>
	)
} 

function Buyorder({ coinId = 'bitcoin' }){
	const { orderBook, loading, error } = useOrderBook(coinId, 30000);
	const bids = orderBook?.bids || [];

	const formatPrice = (price) => {
		if (price === undefined || price === null || isNaN(price)) return '0.00';
		return parseFloat(price).toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	};

	const formatAmount = (amount) => {
		if (amount === undefined || amount === null || isNaN(amount)) return '0.0000';
		return parseFloat(amount).toFixed(4);
	};

	const calculateTotal = (price, amount) => {
		if (price === undefined || price === null || amount === undefined || amount === null || isNaN(price) || isNaN(amount)) {
			return '0.00';
		}
		return (parseFloat(price) * parseFloat(amount)).toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	};

	return(
		<>
			<div className="card">
				<div className="card-header border-0 pb-0">
					<h4 className="mb-0 text-black fs-20">Buy Order</h4>
					<DropDownBlog />
				</div>
				<div className="card-body pb-0 pt-3">
					{loading && bids.length === 0 ? (
						<div className="text-center py-3">
							<div className="spinner-border spinner-border-sm text-primary" role="status"></div>
						</div>
					) : error && bids.length === 0 ? (
						<div className="text-center py-3 text-muted small">Error cargando datos</div>
					) : bids.length === 0 ? (
						<div className="text-center py-3 text-muted small">Sin órdenes de compra</div>
					) : (
						<div className="table-responsive">
							<table className="table text-center bg-warning-hover tr-rounded order-tbl">
								<thead>
									<tr>
										<th className="text-left">Price</th>
										<th className="text-center">Amount</th>
										<th className="text-right">Total</th>
									</tr>
								</thead>
								<tbody>
									{bids.slice(0, 8).map((order, index) => {
										const price = order?.price || 0;
										const quantity = order?.quantity || order?.size || 0;
										return (
											<tr key={index}>
												<td className="text-left">{formatPrice(price)}</td>
												<td>{formatAmount(quantity)}</td>
												<td className="text-right">${calculateTotal(price, quantity)}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</>
	)
} 

export  {Sellorder,Buyorder, DropDownBlog} ;