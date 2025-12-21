import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from 'react-bootstrap';

/**
 * SupportButton - Botón de soporte con dropdown
 * Muestra opciones para chat con AI o abrir ticket de soporte
 */
const SupportButton = () => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [chatMessage, setChatMessage] = useState('');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    email: '',
    message: '',
    priority: 'medium'
  });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calcular posición del dropdown cuando se muestra
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right
      });
    }
  }, [showDropdown]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleChatWithAI = () => {
    setShowDropdown(false);
    setShowChatModal(true);
  };

  const handleOpenTicket = () => {
    setShowDropdown(false);
    setShowTicketModal(true);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      // Aquí puedes integrar con una API de chat
      console.log('[SupportButton] Chat message:', chatMessage);
      // Por ahora solo mostramos un mensaje
      alert('Mensaje enviado: ' + chatMessage);
      setChatMessage('');
      setShowChatModal(false);
    }
  };

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (ticketForm.subject && ticketForm.email && ticketForm.message) {
      // Aquí puedes integrar con tu sistema de tickets
      console.log('[SupportButton] Ticket submitted:', ticketForm);
      // Por ahora solo mostramos un mensaje
      alert(`Ticket creado exitosamente!\nAsunto: ${ticketForm.subject}\nEmail: ${ticketForm.email}`);
      setTicketForm({ subject: '', email: '', message: '', priority: 'medium' });
      setShowTicketModal(false);
    }
  };

  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ position: 'relative', zIndex: 10010 }}>
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        title={t('support.support', 'Support')}
        style={{
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none'
        }}
      >
        <img 
          src="/support.png" 
          alt="Support" 
          style={{ 
            width: '18px', 
            height: '18px', 
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)'
          }} 
        />
      </button>

      {/* Dropdown menu - Oculto hasta que se active */}
      {false && showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            background: 'rgba(21, 26, 46, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 0',
            minWidth: '200px',
            zIndex: 10010,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <button
            onClick={handleChatWithAI}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <i className="fa fa-comments" style={{ fontSize: '16px', color: '#00c087', minWidth: '20px' }}></i>
            <span>{t('support.chat_with_ai', 'Chat with AI')}</span>
          </button>

          <div
            style={{
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)',
              margin: '4px 0'
            }}
          />

          <button
            onClick={handleOpenTicket}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <i className="fa fa-ticket-alt" style={{ fontSize: '16px', color: '#00e5cc', minWidth: '20px' }}></i>
            <span>{t('support.open_ticket', 'Open Support Ticket')}</span>
          </button>
        </div>
      )}

      {/* Modal de Chat con AI */}
      <Modal 
        show={showChatModal} 
        onHide={() => setShowChatModal(false)}
        centered
        size="md"
        style={{ zIndex: 10020 }}
      >
        <Modal.Header closeButton style={{ background: 'rgba(21, 26, 46, 0.98)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
          <Modal.Title>
            <i className="fa fa-comments me-2" style={{ color: '#00c087' }}></i>
            {t('support.chat_with_ai', 'Chat with AI')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'rgba(21, 26, 46, 0.98)', color: '#ffffff', minHeight: '300px' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '16px',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <i className="fa fa-robot" style={{ fontSize: '48px', color: '#00c087', opacity: 0.5 }}></i>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', margin: 0 }}>
              ¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?
            </p>
          </div>
          <form onSubmit={handleSendChat}>
            <div className="form-group mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Escribe tu mensaje aquí..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderRadius: '8px'
                }}
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowChatModal(false)}
                style={{ borderRadius: '8px' }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="primary" 
                style={{ 
                  background: '#00c087', 
                  border: 'none',
                  borderRadius: '8px'
                }}
              >
                <i className="fa fa-paper-plane me-2"></i>
                Enviar
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Modal de Support Ticket */}
      <Modal 
        show={showTicketModal} 
        onHide={() => setShowTicketModal(false)}
        centered
        size="lg"
        style={{ zIndex: 10020 }}
      >
        <Modal.Header closeButton style={{ background: 'rgba(21, 26, 46, 0.98)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
          <Modal.Title>
            <i className="fa fa-ticket-alt me-2" style={{ color: '#00e5cc' }}></i>
            {t('support.open_ticket', 'Open Support Ticket')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'rgba(21, 26, 46, 0.98)', color: '#ffffff' }}>
          <form onSubmit={handleSubmitTicket}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Asunto *</label>
                <input
                  type="text"
                  className="form-control"
                  name="subject"
                  value={ticketForm.subject}
                  onChange={handleTicketInputChange}
                  placeholder="Ej: Problema con mi cuenta"
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={ticketForm.email}
                  onChange={handleTicketInputChange}
                  placeholder="tu@email.com"
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Prioridad</label>
                <select
                  className="form-control"
                  name="priority"
                  value={ticketForm.priority}
                  onChange={handleTicketInputChange}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Mensaje *</label>
                <textarea
                  className="form-control"
                  rows="5"
                  name="message"
                  value={ticketForm.message}
                  onChange={handleTicketInputChange}
                  placeholder="Describe tu problema o consulta en detalle..."
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowTicketModal(false)}
                style={{ borderRadius: '8px' }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="primary" 
                style={{ 
                  background: '#00e5cc', 
                  border: 'none',
                  borderRadius: '8px'
                }}
              >
                <i className="fa fa-paper-plane me-2"></i>
                Enviar Ticket
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SupportButton;

