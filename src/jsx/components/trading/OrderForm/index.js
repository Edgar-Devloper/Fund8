import React from 'react';

/**
 * OrderForm (placeholder)
 * Props planificadas:
 *  - symbol (string)
 *  - side ("buy" | "sell")
 *  - type ("limit" | "market" | fut: "stop" | "stop_limit")
 *  - onSubmit(orderDraft)
 *  - onValidate?(draft) => errors
 *  - balances?: { [asset: string]: number }
 *  - priceTick / qtyStep para validaciones
 * Estados siguientes: validación en vivo, loading envío, error API
 */
const OrderForm = () => {
  return (
    <div className="card h-100" style={{borderRadius:22}}>
      <div className="card-header d-flex align-items-center" style={{padding:'10px 16px', borderTopLeftRadius:22, borderTopRightRadius:22}}>
        <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px'}}>Order Form</h6>
        <span className="badge bg-primary ms-auto" style={{borderRadius:18}}>Placeholder</span>
      </div>
      <div className="card-body d-flex flex-column" style={{padding:'14px 16px 18px'}}>
        <div className="mb-3 small text-muted" style={{lineHeight:1.4}}>Formulario de órdenes. Próximo: inputs precio, cantidad, botones BUY/SELL, validaciones y resumen de coste.</div>
        <div className="mt-auto">
          <div className="rounded-4" style={{background:'linear-gradient(135deg, #fff7ed, #ffe7d5)', padding:'14px 18px'}}>
            <div className="small fw-semibold" style={{color:'#b45309'}}>Pendiente de integración.</div>
            <div className="small mt-1" style={{color:'#92400e'}}>Se añadirá soporte a órdenes limit, market y stop.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
